import type { MapPan, MapSize, MapViewport } from './map-view';

export interface MapDrawRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export const getMapDrawRect = (
  viewport: MapViewport,
  baseSize: MapSize,
  zoom: number,
  pan: MapPan
): MapDrawRect => {
  const width = Math.round(baseSize.width * zoom);
  const height = Math.round(baseSize.height * zoom);

  return {
    left: Math.round((viewport.width - width) / 2 + pan.x),
    top: Math.round((viewport.height - height) / 2 + pan.y),
    width,
    height,
  };
};
