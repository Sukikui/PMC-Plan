export const MAP_TOOLTIP_LABEL_MAX_WIDTH_REM = 16.9;
export const MAP_TOOLTIP_IMAGE_MAX_WIDTH_REM = 25;
export const MAP_TOOLTIP_IMAGE_MAX_HEIGHT_REM = MAP_TOOLTIP_IMAGE_MAX_WIDTH_REM * 1.5;
export const MAP_TOOLTIP_VIEWPORT_MARGIN_PX = 12;
export const MAP_TOOLTIP_PREVIEW_PANEL_MIN_Z_INDEX = 50;
export const MAP_TOOLTIP_PREVIEW_PANEL_MAX_Z_INDEX = 9999;

const TOOLTIP_LABEL_FONT = '500 12px ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
const TOOLTIP_LABEL_HORIZONTAL_PADDING_PX = 20;

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

export const measureMapTooltipLabelWidth = (label: string) => {
  const context = getTooltipMeasureContext();
  const maxWidth = getTooltipMaxWidthPx();
  const maxTextWidth = Math.max(0, maxWidth - TOOLTIP_LABEL_HORIZONTAL_PADDING_PX);

  if (!context) {
    return undefined;
  }

  context.font = TOOLTIP_LABEL_FONT;

  const words = label.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return undefined;
  }

  let currentLine = '';
  let widestLine = 0;
  let hasWrapped = false;

  for (const word of words) {
    const nextLine = currentLine ? `${currentLine} ${word}` : word;
    const nextLineWidth = context.measureText(nextLine).width;

    if (currentLine && nextLineWidth > maxTextWidth) {
      hasWrapped = true;
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
      widestLine = maxTextWidth;
      currentLine = '';
      continue;
    }

    currentLine = nextLine;
  }

  if (currentLine) {
    widestLine = Math.max(widestLine, context.measureText(currentLine).width);
  }

  if (!hasWrapped) {
    return undefined;
  }

  return Math.min(maxWidth, Math.ceil(widestLine + TOOLTIP_LABEL_HORIZONTAL_PADDING_PX));
};

export const getMapTooltipPreviewImageHeightRem = (aspectRatio: number | undefined) => {
  if (!aspectRatio || aspectRatio <= 0) {
    return undefined;
  }

  return Math.min(MAP_TOOLTIP_IMAGE_MAX_WIDTH_REM / aspectRatio, MAP_TOOLTIP_IMAGE_MAX_HEIGHT_REM);
};
