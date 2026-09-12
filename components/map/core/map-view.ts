import { getMapAspectRatio, type MapMetadata } from '@/lib/map/metadata';

export interface MapViewport {
  width: number;
  height: number;
}

export interface MapSize {
  width: number;
  height: number;
}

export interface MapPercentPosition {
  left: number;
  top: number;
}

export interface MapPan {
  x: number;
  y: number;
}

export interface MapPreviewArea {
  x: number;
  z: number;
  width: number;
  height: number;
}

export function getPreviewMinZoom(baseSize: MapSize, viewport: MapViewport, metadata: MapMetadata, area: MapPreviewArea) {
  if (!baseSize.height || !viewport.width || !viewport.height) return MIN_ZOOM;
  const height = Math.max(area.height, area.width * viewport.height / viewport.width);
  return viewport.height * metadata.overview.height * metadata.overview.cellSize / (height * baseSize.height);
}

export function clampPreviewPan(pan: MapPan, center: MapPan, viewport: MapViewport, zoom: number, minZoom: number): MapPan {
  const extent = Math.max(0, zoom / minZoom - 1);
  const maxX = viewport.width * extent / 2;
  const maxY = viewport.height * extent / 2;
  return {
    x: clamp(pan.x, center.x - maxX, center.x + maxX),
    y: clamp(pan.y, center.y - maxY, center.y + maxY),
  };
}

const MIN_MAP_FIT_RATIO = 0.85;
export const MIN_ZOOM = MIN_MAP_FIT_RATIO;
const MAX_MAP_BLOCK_PIXEL_SIZE = 16;

export const clamp = (value: number, min: number, max: number) => (
  Math.min(Math.max(value, min), max)
);

export const lerp = (start: number, end: number, progress: number) => (
  start + (end - start) * progress
);

export const easeInOutSine = (progress: number) => (
  0.5 - Math.cos(Math.PI * progress) / 2
);

export const getFittedMapSize = (
  viewport: MapViewport,
  metadata: MapMetadata
): MapSize => {
  if (!viewport.width || !viewport.height) {
    return { width: 0, height: 0 };
  }

  const mapAspectRatio = getMapAspectRatio(metadata);
  const viewportAspectRatio = viewport.width / viewport.height;

  if (viewportAspectRatio > mapAspectRatio) {
    return {
      width: viewport.height * mapAspectRatio,
      height: viewport.height,
    };
  }

  return {
    width: viewport.width,
    height: viewport.width / mapAspectRatio,
  };
};

export const getMaxZoom = (baseWidth: number, metadata: MapMetadata) => {
  if (!baseWidth || metadata.overview.width <= 0) {
    return MIN_ZOOM;
  }

  const blockPixelSizeAtFit = (
    baseWidth / metadata.overview.width / metadata.overview.cellSize
  );
  return Math.max(MIN_ZOOM, MAX_MAP_BLOCK_PIXEL_SIZE / blockPixelSizeAtFit);
};

export const getZoomForMapCellPixelSize = (
  baseWidth: number,
  metadata: MapMetadata,
  cellPixelSize: number
) => {
  if (!baseWidth || metadata.overview.width <= 0) {
    return MIN_ZOOM;
  }

  return cellPixelSize / (baseWidth / metadata.overview.width);
};

export const getPanForMapPosition = (
  position: MapPercentPosition,
  zoom: number,
  baseSize: MapSize
): MapPan => ({
  x: -((position.left / 100) - 0.5) * baseSize.width * zoom,
  y: -((position.top / 100) - 0.5) * baseSize.height * zoom,
});

export const mapPercentToScreenPoint = (
  position: MapPercentPosition,
  viewport: MapViewport,
  baseSize: MapSize,
  pan: MapPan,
  zoom: number
) => ({
  left: (viewport.width / 2) + pan.x + ((position.left / 100) - 0.5) * baseSize.width * zoom,
  top: (viewport.height / 2) + pan.y + ((position.top / 100) - 0.5) * baseSize.height * zoom,
});
