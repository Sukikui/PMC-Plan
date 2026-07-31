import type { MapViewport } from './map-view';

export interface MapPanelRect {
  left: number;
  right: number;
  top: number;
  bottom: number;
  width: number;
  height: number;
}

export interface MapSafeArea {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

const VIEWPORT_MARGIN_PX = 40;
const PANEL_GAP_PX = 24;
const MIN_SAFE_WIDTH_RATIO = 0.3;
const MIN_PANEL_HEIGHT_PX = 160;
const MIN_BOTTOM_PANEL_WIDTH_PX = 140;

export const getVisibleMapPanelRects = (): MapPanelRect[] => {
  if (typeof document === 'undefined') return [];

  return Array.from(document.querySelectorAll<HTMLElement>('[data-map-panel]')).flatMap((element) => {
    const style = window.getComputedStyle(element);
    if (
      style.visibility === 'hidden' ||
      style.display === 'none' ||
      Number.parseFloat(style.opacity) === 0
    ) {
      return [];
    }

    const rect = element.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0 ? [rect] : [];
  });
};

export const getMapSafeArea = (
  viewport: MapViewport,
  panels: MapPanelRect[]
): MapSafeArea => {
  let left = VIEWPORT_MARGIN_PX;
  let right = viewport.width - VIEWPORT_MARGIN_PX;
  let bottom = viewport.height - VIEWPORT_MARGIN_PX;

  panels.forEach((panel) => {
    if (panel.height < MIN_PANEL_HEIGHT_PX) {
      if (
        panel.width >= MIN_BOTTOM_PANEL_WIDTH_PX &&
        panel.top > viewport.height / 2
      ) {
        bottom = Math.min(bottom, panel.top - PANEL_GAP_PX);
      }
      return;
    }

    if (panel.left < viewport.width / 2) {
      left = Math.max(left, panel.right + PANEL_GAP_PX);
    }
    if (panel.right > viewport.width / 2) {
      right = Math.min(right, panel.left - PANEL_GAP_PX);
    }
  });

  if (right - left < viewport.width * MIN_SAFE_WIDTH_RATIO) {
    left = VIEWPORT_MARGIN_PX;
    right = viewport.width - VIEWPORT_MARGIN_PX;
  }

  return {
    left,
    right,
    top: VIEWPORT_MARGIN_PX,
    bottom,
  };
};
