import type { MapMetadata } from '@/lib/map/metadata';
import type { MapDrawRect } from './map-geometry';

export interface MapScreenPosition {
  x: number;
  y: number;
}

export interface MapGridCell {
  coordinates: {
    x: number;
    z: number;
  };
  screen: {
    left: number;
    top: number;
    size: number;
  };
}

export function getMapBlockPixelSize(
  metadata: MapMetadata,
  drawRect: MapDrawRect,
) {
  return drawRect.width / metadata.overview.width / metadata.overview.cellSize;
}

export function getMapGridCellAtScreenPosition(
  metadata: MapMetadata,
  drawRect: MapDrawRect,
  position: MapScreenPosition,
): MapGridCell | null {
  const blockPixelSize = getMapBlockPixelSize(metadata, drawRect);
  if (blockPixelSize <= 0) return null;

  const blockX = Math.floor((position.x - drawRect.left) / blockPixelSize);
  const blockZ = Math.floor((position.y - drawRect.top) / blockPixelSize);
  const x = metadata.gridOrigin.x + blockX;
  const z = metadata.gridOrigin.z + blockZ;

  if (
    blockX < 0
    || blockZ < 0
    || x < metadata.selectionMin.x
    || x > metadata.selectionMax.x
    || z < metadata.selectionMin.z
    || z > metadata.selectionMax.z
  ) {
    return null;
  }

  return {
    coordinates: { x, z },
    screen: {
      left: drawRect.left + blockX * blockPixelSize,
      top: drawRect.top + blockZ * blockPixelSize,
      size: blockPixelSize,
    },
  };
}
