import overworldMapMetadata from '@/public/map/overworld/metadata.json';
import netherMapMetadata from '@/public/map/nether/metadata.json';

export interface MapCoordinate {
  x: number;
  z: number;
}

interface MapOverviewMetadata {
  image: string;
  width: number;
  height: number;
  cellSize: number;
}

export interface MapTilesMetadata {
  directory: string;
  filePattern: string;
  width: number;
  height: number;
  cellSize: number;
  tileSize: number;
  columns: number;
  rows: number;
}

export interface MapMetadata {
  selectionMin: MapCoordinate;
  selectionMax: MapCoordinate;
  gridOrigin: MapCoordinate;
  overview: MapOverviewMetadata;
  tiles?: MapTilesMetadata;
  fallbackBackground?: string;
}

interface StoredMapMetadata extends Omit<MapMetadata, 'overview' | 'tiles'> {
  formatVersion: number;
  overview: MapOverviewMetadata;
  tiles?: MapTilesMetadata;
}

export const OVERWORLD_MAP_WORLD = 'overworld';
export const NETHER_MAP_WORLD = 'nether';

export type MapWorld = typeof OVERWORLD_MAP_WORLD | typeof NETHER_MAP_WORLD;

export const mapMetadataByWorld: Record<MapWorld, MapMetadata> = {
  overworld: normalizeMapMetadata(OVERWORLD_MAP_WORLD, overworldMapMetadata),
  nether: normalizeMapMetadata(NETHER_MAP_WORLD, netherMapMetadata),
};

export const getMapAspectRatio = (metadata: MapMetadata) => (
  metadata.overview.width / metadata.overview.height
);

export const getMapWorldSize = (metadata: MapMetadata) => ({
  width: metadata.overview.width * metadata.overview.cellSize,
  height: metadata.overview.height * metadata.overview.cellSize,
});

const clampPercent = (value: number) => Math.min(Math.max(value, 0), 100);

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

function normalizeMapMetadata(
  world: MapWorld,
  rawMetadata: StoredMapMetadata
): MapMetadata {
  return {
    selectionMin: rawMetadata.selectionMin,
    selectionMax: rawMetadata.selectionMax,
    gridOrigin: rawMetadata.gridOrigin,
    fallbackBackground: rawMetadata.fallbackBackground,
    overview: {
      ...rawMetadata.overview,
      image: resolveMapAssetPath(world, rawMetadata.overview.image),
    },
    tiles: rawMetadata.tiles
      ? {
          ...rawMetadata.tiles,
          directory: resolveMapAssetPath(world, rawMetadata.tiles.directory),
        }
      : undefined,
  };
}

function resolveMapAssetPath(world: MapWorld, path: string) {
  return path.startsWith('/') ? path : `/map/${world}/${path}`;
}
