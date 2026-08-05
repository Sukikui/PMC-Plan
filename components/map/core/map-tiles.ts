import type { MapTilesMetadata } from '@/lib/map/metadata';
import type { MapDrawRect } from './map-geometry';
import type { MapViewport } from './map-view';

interface MapTilePosition {
  column: number;
  row: number;
}

export interface MapTileDescriptor extends MapTilePosition {
  src: string;
  width: number;
  height: number;
}

const TILE_OVERSCAN = 1;

export const getVisibleMapTiles = (
  tiles: MapTilesMetadata,
  viewport: MapViewport,
  drawRect: MapDrawRect
): MapTileDescriptor[] => {
  const visibleLeft = Math.max(0, drawRect.left);
  const visibleTop = Math.max(0, drawRect.top);
  const visibleRight = Math.min(viewport.width, drawRect.left + drawRect.width);
  const visibleBottom = Math.min(viewport.height, drawRect.top + drawRect.height);

  if (
    drawRect.width <= 0 ||
    drawRect.height <= 0 ||
    visibleRight <= visibleLeft ||
    visibleBottom <= visibleTop
  ) {
    return [];
  }

  const sourceLeft = ((visibleLeft - drawRect.left) / drawRect.width) * tiles.width;
  const sourceTop = ((visibleTop - drawRect.top) / drawRect.height) * tiles.height;
  const sourceRight = ((visibleRight - drawRect.left) / drawRect.width) * tiles.width;
  const sourceBottom = ((visibleBottom - drawRect.top) / drawRect.height) * tiles.height;
  const firstColumn = clampTileIndex(
    Math.floor(sourceLeft / tiles.tileSize) - TILE_OVERSCAN,
    tiles.columns
  );
  const lastColumn = clampTileIndex(
    Math.ceil(sourceRight / tiles.tileSize) - 1 + TILE_OVERSCAN,
    tiles.columns
  );
  const firstRow = clampTileIndex(
    Math.floor(sourceTop / tiles.tileSize) - TILE_OVERSCAN,
    tiles.rows
  );
  const lastRow = clampTileIndex(
    Math.ceil(sourceBottom / tiles.tileSize) - 1 + TILE_OVERSCAN,
    tiles.rows
  );
  const visibleTiles: MapTileDescriptor[] = [];

  for (let row = firstRow; row <= lastRow; row += 1) {
    for (let column = firstColumn; column <= lastColumn; column += 1) {
      visibleTiles.push({
        column,
        row,
        src: getMapTileSource(tiles, column, row),
        width: Math.min(tiles.tileSize, tiles.width - column * tiles.tileSize),
        height: Math.min(tiles.tileSize, tiles.height - row * tiles.tileSize),
      });
    }
  }

  return visibleTiles;
};

const getMapTileSource = (
  tiles: MapTilesMetadata,
  column: number,
  row: number
) => {
  const fileName = tiles.filePattern
    .replace('{column}', String(column))
    .replace('{row}', String(row));

  return `${tiles.directory.replace(/\/$/, '')}/${fileName}`;
};

const clampTileIndex = (index: number, count: number) => (
  Math.min(Math.max(index, 0), count - 1)
);
