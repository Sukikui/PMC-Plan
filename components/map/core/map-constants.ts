export const PAN_OVERSCROLL_VISIBLE_RATIO = 0.5;
export const WHEEL_ZOOM_INTENSITY = 0.002;
export const MAX_WHEEL_DELTA = 80;
export const CLICK_DRAG_TOLERANCE_PX = 5;
export const BLOCK_GRID_MIN_PIXEL_SIZE = 2;
export const ICON_MIN_MAP_CELL_PIXEL_SIZE = 7;
export const MAP_ICON_MIN_SCALE = 1;
export const MAP_ICON_MAX_SCALE = 3.5;
export const POINT_TOOLTIP_OFFSET = 8;
export const ICON_TOOLTIP_OFFSET = 38;
export const PLACE_PREVIEW_DELAY_MS = 800;
export const PLACE_PREVIEW_ANIMATION_DURATION_MS = 240;
export const FOCUS_MAP_CELL_PIXEL_SIZE = 11;
export const FOCUS_ANIMATION_DURATION_MS = 620;
export const MAP_ICON_REVEAL_DURATION_MS = 260;
export const MAP_ICON_TO_POINT_DURATION_MS = 300;
export const MAP_REVEAL_MAX_DELAY_MS = 280;
export const MAP_REVEAL_END_BUFFER_MS = 80;
export const MAP_POINT_BASE_Z_INDEX = 20;
export const MAP_POINT_HOVER_Z_INDEX = 1000;

export const getStableRevealDelay = (id: string) => {
  let hash = 0;

  for (let index = 0; index < id.length; index += 1) {
    hash = (hash * 31 + id.charCodeAt(index)) >>> 0;
  }

  return hash % MAP_REVEAL_MAX_DELAY_MS;
};
