import {
  MAP_TOOLTIP_PREVIEW_PANEL_MAX_Z_INDEX,
  MAP_TOOLTIP_PREVIEW_PANEL_MIN_Z_INDEX,
  MAP_TOOLTIP_VIEWPORT_MARGIN_PX,
} from './map-tooltip';

const IMAGE_GAP_PX = 8;

export interface MapTooltipRect {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

interface FixedStyle {
  left: number;
  top: number;
  transform: string;
  visibility: 'visible';
}

interface ImageBox {
  left: number;
  top: number;
  width: number;
  height: number;
}

interface LayoutCandidate {
  labelStyle: FixedStyle;
  image?: ImageBox;
}

interface LayoutParams {
  anchorLeft: number;
  pointTop: number;
  offset: number;
  labelWidth: number;
  labelHeight: number;
  viewportWidth: number;
  viewportHeight: number;
  imageWidth?: number;
  imageHeight?: number;
  panelRects: MapTooltipRect[];
  avoidLabelRects?: MapTooltipRect[];
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const overlapArea = (first: MapTooltipRect, second: MapTooltipRect) => {
  const width = Math.max(0, Math.min(first.right, second.right) - Math.max(first.left, second.left));
  const height = Math.max(0, Math.min(first.bottom, second.bottom) - Math.max(first.top, second.top));
  return width * height;
};

const isClear = (rect: MapTooltipRect, rects: MapTooltipRect[]) => (
  rects.every((otherRect) => overlapArea(rect, otherRect) === 0)
);

const labelRect = (style: FixedStyle, width: number, height: number): MapTooltipRect => {
  const top = style.transform.includes('-100%') ? style.top - height : style.top;
  return {
    left: style.left - width / 2,
    right: style.left + width / 2,
    top,
    bottom: top + height,
  };
};

const imageRect = (image: ImageBox): MapTooltipRect => ({
  left: image.left - image.width / 2,
  right: image.left + image.width / 2,
  top: image.top,
  bottom: image.top + image.height,
});

const overlapScore = (image: ImageBox | undefined, rects: MapTooltipRect[]) => (
  image ? rects.reduce((total, rect) => total + overlapArea(imageRect(image), rect), 0) : 0
);

export const getVisiblePanelRects = () => {
  if (typeof document === 'undefined') return [];

  return Array.from(document.body.querySelectorAll<HTMLElement>('*')).flatMap((element) => {
    if (element.closest('[data-map-tooltip-preview-root]')) return [];

    const styles = window.getComputedStyle(element);
    const zIndex = Number.parseInt(styles.zIndex, 10);
    if (
      styles.position !== 'fixed' ||
      !Number.isFinite(zIndex) ||
      zIndex < MAP_TOOLTIP_PREVIEW_PANEL_MIN_Z_INDEX ||
      zIndex >= MAP_TOOLTIP_PREVIEW_PANEL_MAX_Z_INDEX ||
      styles.visibility === 'hidden' ||
      styles.display === 'none' ||
      Number.parseFloat(styles.opacity) === 0
    ) return [];

    const rect = element.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0 ? [rect] : [];
  });
};

export const getVisibleTooltipLabelRects = (excludedPointId: string) => {
  if (typeof document === 'undefined') return [];

  return Array.from(document.body.querySelectorAll<HTMLElement>('[data-map-tooltip-label-root]')).flatMap((element) => {
    if (element.dataset.mapTooltipPointId === excludedPointId) return [];
    const rect = element.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0 ? [rect] : [];
  });
};

const centeredLeft = (target: number, width: number, viewportWidth: number) => {
  const min = MAP_TOOLTIP_VIEWPORT_MARGIN_PX + width / 2;
  const max = viewportWidth - MAP_TOOLTIP_VIEWPORT_MARGIN_PX - width / 2;
  return max >= min ? clamp(target, min, max) : viewportWidth / 2;
};

const isInViewport = (rect: MapTooltipRect, viewportHeight: number) => (
  rect.top >= MAP_TOOLTIP_VIEWPORT_MARGIN_PX &&
  rect.bottom <= viewportHeight - MAP_TOOLTIP_VIEWPORT_MARGIN_PX
);

const verticalCandidates = ({
  anchorLeft,
  pointTop,
  offset,
  labelWidth,
  labelHeight,
  viewportWidth,
  imageWidth,
  imageHeight,
}: LayoutParams): LayoutCandidate[] => {
  const labelLeft = centeredLeft(anchorLeft, labelWidth, viewportWidth);
  const imageLeft = imageWidth ? centeredLeft(labelLeft, imageWidth, viewportWidth) : labelLeft;
  const aboveLabelBottom = pointTop - offset;
  const belowLabelTop = pointTop + offset;

  return [
    {
      labelStyle: { left: labelLeft, top: aboveLabelBottom, transform: 'translate3d(-50%, -100%, 0)', visibility: 'visible' },
      image: imageWidth && imageHeight
        ? { left: imageLeft, top: aboveLabelBottom - labelHeight - IMAGE_GAP_PX - imageHeight, width: imageWidth, height: imageHeight }
        : undefined,
    },
    {
      labelStyle: { left: labelLeft, top: belowLabelTop, transform: 'translate3d(-50%, 0, 0)', visibility: 'visible' },
      image: imageWidth && imageHeight
        ? { left: imageLeft, top: belowLabelTop + labelHeight + IMAGE_GAP_PX, width: imageWidth, height: imageHeight }
        : undefined,
    },
  ];
};

const pickBest = (candidates: LayoutCandidate[], panelRects: MapTooltipRect[]) => (
  candidates.find((candidate) => overlapScore(candidate.image, panelRects) === 0) ??
  candidates.reduce((best, candidate) => (
    overlapScore(candidate.image, panelRects) < overlapScore(best.image, panelRects) ? candidate : best
  ), candidates[0])
);

const fallbackLabel = (params: LayoutParams): LayoutCandidate => {
  const { anchorLeft, pointTop, offset, labelWidth, labelHeight, viewportWidth, viewportHeight } = params;
  const labelLeft = centeredLeft(anchorLeft, labelWidth, viewportWidth);
  const labelBottom = clamp(
    pointTop - offset,
    MAP_TOOLTIP_VIEWPORT_MARGIN_PX + labelHeight,
    viewportHeight - MAP_TOOLTIP_VIEWPORT_MARGIN_PX
  );

  return {
    labelStyle: { left: labelLeft, top: labelBottom, transform: 'translate3d(-50%, -100%, 0)', visibility: 'visible' },
  };
};

const sideImage = (label: LayoutCandidate, params: LayoutParams): ImageBox | undefined => {
  const { anchorLeft, pointTop, offset, labelWidth, labelHeight, viewportWidth, viewportHeight, imageWidth, imageHeight, panelRects } = params;
  if (!imageWidth || !imageHeight) return undefined;

  const rect = labelRect(label.labelStyle, labelWidth, labelHeight);
  const maxTop = Math.max(MAP_TOOLTIP_VIEWPORT_MARGIN_PX, viewportHeight - MAP_TOOLTIP_VIEWPORT_MARGIN_PX - imageHeight);
  const top = clamp(rect.top + (labelHeight - imageHeight) / 2, MAP_TOOLTIP_VIEWPORT_MARGIN_PX, maxTop);
  const pointSize = Math.max(offset * 2, 24);
  const protectedRects = [
    rect,
    { left: anchorLeft - pointSize / 2, right: anchorLeft + pointSize / 2, top: pointTop - pointSize / 2, bottom: pointTop + pointSize / 2 },
  ];
  const candidates = [
    { left: centeredLeft(rect.left - IMAGE_GAP_PX - imageWidth / 2, imageWidth, viewportWidth), top, width: imageWidth, height: imageHeight },
    { left: centeredLeft(rect.right + IMAGE_GAP_PX + imageWidth / 2, imageWidth, viewportWidth), top, width: imageWidth, height: imageHeight },
  ];
  const safeCandidates = candidates.filter((candidate) => overlapScore(candidate, protectedRects) === 0);

  return (safeCandidates.length ? safeCandidates : candidates).reduce((best, candidate) => (
    overlapScore(candidate, panelRects) < overlapScore(best, panelRects) ? candidate : best
  ));
};

export const getMapTooltipLayout = (params: LayoutParams) => {
  const { labelWidth, labelHeight, viewportHeight, imageWidth, imageHeight, panelRects, avoidLabelRects = [] } = params;
  const candidates = verticalCandidates(params).filter((candidate) => {
    const rect = labelRect(candidate.labelStyle, labelWidth, labelHeight);
    return isInViewport(rect, viewportHeight) &&
      isClear(rect, avoidLabelRects) &&
      (!candidate.image || isInViewport(imageRect(candidate.image), viewportHeight));
  });

  const picked = candidates.length ? pickBest(candidates, panelRects) : fallbackLabel(params);
  const fallbackImage = !picked.image && imageWidth && imageHeight ? sideImage(picked, params) : undefined;
  const image = picked.image ?? fallbackImage;

  return {
    labelStyle: picked.labelStyle,
    imageStyle: image
      ? { left: image.left, top: image.top, transform: 'translate3d(-50%, 0, 0)', visibility: 'visible' as const }
      : null,
  };
};
