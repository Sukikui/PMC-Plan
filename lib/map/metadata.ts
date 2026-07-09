import overworldMapMetadata from '@/public/map/overworld/metadata.json';
import netherMapMetadata from '@/public/map/nether/metadata.json';

export interface MapCoordinate {
  x: number;
  z: number;
}

export interface MapMetadata {
  cellSize: number;
  selectionMin: MapCoordinate;
  selectionMax: MapCoordinate;
  gridOrigin: MapCoordinate;
  width: number;
  height: number;
  image: string;
  fallbackBackground?: string;
}

export const OVERWORLD_MAP_WORLD = 'overworld';
export const NETHER_MAP_WORLD = 'nether';

export type MapWorld = typeof OVERWORLD_MAP_WORLD | typeof NETHER_MAP_WORLD;

export const mapMetadataByWorld: Record<MapWorld, MapMetadata> = {
  overworld: overworldMapMetadata,
  nether: netherMapMetadata,
};

export const getMapAspectRatio = (metadata: MapMetadata) => metadata.width / metadata.height;

export const getMapWorldSize = (metadata: MapMetadata) => ({
  width: metadata.width * metadata.cellSize,
  height: metadata.height * metadata.cellSize,
});

export const getMapWorldBounds = (metadata: MapMetadata) => {
  const size = getMapWorldSize(metadata);

  return {
    minX: metadata.gridOrigin.x,
    minZ: metadata.gridOrigin.z,
    maxX: metadata.gridOrigin.x + size.width - 1,
    maxZ: metadata.gridOrigin.z + size.height - 1,
  };
};

export const clampPercent = (value: number) => Math.min(Math.max(value, 0), 100);

export const worldToMapPercent = (
  metadata: MapMetadata,
  coordinates: MapCoordinate
) => {
  const size = getMapWorldSize(metadata);
  const left = ((coordinates.x - metadata.gridOrigin.x) / size.width) * 100;
  const top = ((coordinates.z - metadata.gridOrigin.z) / size.height) * 100;

  return {
    left: clampPercent(left),
    top: clampPercent(top),
    inBounds: left >= 0 && left <= 100 && top >= 0 && top <= 100,
  };
};
