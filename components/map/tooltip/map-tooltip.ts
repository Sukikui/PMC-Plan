export const MAP_TOOLTIP_LABEL_MAX_WIDTH_REM = 16.9;
export const MAP_TOOLTIP_IMAGE_MAX_WIDTH_REM = 25;
export const MAP_TOOLTIP_IMAGE_MAX_HEIGHT_REM = MAP_TOOLTIP_IMAGE_MAX_WIDTH_REM * 1.5;
export const MAP_TOOLTIP_VIEWPORT_MARGIN_PX = 12;

const TOOLTIP_LABEL_FONT = '500 12px ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
const TOOLTIP_LABEL_HORIZONTAL_PADDING_PX = 20;
const TOOLTIP_LABEL_VERTICAL_PADDING_PX = 8;
const TOOLTIP_LABEL_LINE_HEIGHT_PX = 16.5;
const TOOLTIP_LABEL_FALLBACK_CHARACTER_WIDTH_PX = 6.5;
const TOOLTIP_UNIDENTIFIED_LABEL_WIDTH_PX = 32;
const TOOLTIP_SPACE_LOGO_SIZE_PX = 36;
const TOOLTIP_SPACE_LOGO_GAP_PX = 6;

let tooltipMeasureContext: CanvasRenderingContext2D | null = null;

const getTooltipMaxWidthPx = () => {
  if (typeof window === 'undefined') {
    return MAP_TOOLTIP_LABEL_MAX_WIDTH_REM * 16;
  }

  const rootFontSize = Number.parseFloat(window.getComputedStyle(document.documentElement).fontSize);
  return MAP_TOOLTIP_LABEL_MAX_WIDTH_REM * (Number.isFinite(rootFontSize) ? rootFontSize : 16);
};

const getTooltipMeasureContext = () => {
  if (typeof document === 'undefined') {
    return null;
  }

  if (tooltipMeasureContext) {
    return tooltipMeasureContext;
  }

  const canvas = document.createElement('canvas');
  tooltipMeasureContext = canvas.getContext('2d');
  return tooltipMeasureContext;
};

export const isMapTooltipPreviewElement = (target: EventTarget | null) => (
  target instanceof HTMLElement && Boolean(target.closest('[data-map-tooltip-preview-root]'))
);

interface MapTooltipTextMeasurement {
  height: number;
  width: number;
  wrapped: boolean;
}

const measureMapTooltipText = (label: string): MapTooltipTextMeasurement | null => {
  const context = getTooltipMeasureContext();
  const maxWidth = getTooltipMaxWidthPx();
  const maxTextWidth = Math.max(0, maxWidth - TOOLTIP_LABEL_HORIZONTAL_PADDING_PX);

  if (!context) return null;

  context.font = TOOLTIP_LABEL_FONT;

  const words = label.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return null;

  let currentLine = '';
  let widestLine = 0;
  let hasWrapped = false;
  let lineCount = 1;

  for (const word of words) {
    const nextLine = currentLine ? `${currentLine} ${word}` : word;
    const nextLineWidth = context.measureText(nextLine).width;

    if (currentLine && nextLineWidth > maxTextWidth) {
      hasWrapped = true;
      lineCount += 1;
      widestLine = Math.max(widestLine, context.measureText(currentLine).width);
      currentLine = word;

      if (context.measureText(word).width > maxTextWidth) {
        widestLine = maxTextWidth;
        currentLine = '';
      }

      continue;
    }

    if (!currentLine && nextLineWidth > maxTextWidth) {
      hasWrapped = true;
      lineCount += Math.max(0, Math.ceil(nextLineWidth / maxTextWidth) - 1);
      widestLine = maxTextWidth;
      currentLine = '';
      continue;
    }

    currentLine = nextLine;
  }

  if (currentLine) {
    widestLine = Math.max(widestLine, context.measureText(currentLine).width);
  }

  return {
    height: Math.ceil(TOOLTIP_LABEL_VERTICAL_PADDING_PX + lineCount * TOOLTIP_LABEL_LINE_HEIGHT_PX),
    width: Math.min(maxWidth, Math.ceil(widestLine + TOOLTIP_LABEL_HORIZONTAL_PADDING_PX)),
    wrapped: hasWrapped,
  };
};

export const measureMapTooltipLabelWidth = (label: string) => {
  const measurement = measureMapTooltipText(label);
  return measurement?.wrapped ? measurement.width : undefined;
};

export const estimateMapTooltipSize = (
  label: string,
  options: { hasSpaceLogo?: boolean; unidentified?: boolean } = {},
) => {
  const measurement = measureMapTooltipText(label);
  const maxWidth = getTooltipMaxWidthPx();
  const labelWidth = options.unidentified
    ? TOOLTIP_UNIDENTIFIED_LABEL_WIDTH_PX
    : measurement?.width ?? Math.min(
      maxWidth,
      label.length * TOOLTIP_LABEL_FALLBACK_CHARACTER_WIDTH_PX
        + TOOLTIP_LABEL_HORIZONTAL_PADDING_PX,
    );
  const labelHeight = options.unidentified
    ? 24
    : measurement?.height ?? 25;
  return {
    width: labelWidth + (options.hasSpaceLogo
      ? TOOLTIP_SPACE_LOGO_SIZE_PX + TOOLTIP_SPACE_LOGO_GAP_PX
      : 0),
    height: Math.max(labelHeight, options.hasSpaceLogo ? TOOLTIP_SPACE_LOGO_SIZE_PX : 0),
  };
};

export const hideDominantSpaceLogos = (
  tooltips: MapTooltip[],
  dominantSpaceId?: string,
) => dominantSpaceId
  ? tooltips.map((tooltip) => (
      tooltip.automatic
      && !tooltip.automaticPriority
      && tooltip.spaceLogo?.id === dominantSpaceId
        ? { ...tooltip, spaceLogo: undefined }
        : tooltip
    ))
  : tooltips;

export const getMapTooltipPreviewImageHeightRem = (aspectRatio: number | undefined) => {
  if (!aspectRatio || aspectRatio <= 0) {
    return undefined;
  }

  return Math.min(MAP_TOOLTIP_IMAGE_MAX_WIDTH_REM / aspectRatio, MAP_TOOLTIP_IMAGE_MAX_HEIGHT_REM);
};
import type { MapTooltip } from '../core/map-types';
