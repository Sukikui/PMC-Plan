export const OVERLAY_TRANSITION_MS = 300;
export const OVERLAY_LAYER_ENTRY_DELAY_MS = 140;
export const OVERLAY_BASE_Z_INDEX = 9999;
export const GLOBAL_FOREGROUND_Z_INDEX = OVERLAY_BASE_Z_INDEX + 1000;

export function bringOverlayLayerToFront(
  layers: readonly string[],
  layerId: string,
): string[] {
  return [...layers.filter((id) => id !== layerId), layerId];
}

export function removeOverlayLayer(
  layers: readonly string[],
  layerId: string,
): string[] {
  return layers.filter((id) => id !== layerId);
}
