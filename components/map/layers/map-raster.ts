import type { MapMetadata } from '@/lib/map/metadata';
import type { LoadedMapTile } from '../hooks/useMapTiles';
import type { MapDrawRect } from '../core/map-geometry';

interface DrawMapRasterOptions {
  mapImage: HTMLImageElement | null;
  mapTiles: LoadedMapTile[];
  metadata: MapMetadata;
  drawRect: MapDrawRect;
}

export const drawMapRaster = (
  ctx: CanvasRenderingContext2D,
  { mapImage, mapTiles, metadata, drawRect }: DrawMapRasterOptions
) => {
  if (mapImage) {
    ctx.imageSmoothingEnabled = drawRect.width < metadata.overview.width;
    ctx.drawImage(mapImage, drawRect.left, drawRect.top, drawRect.width, drawRect.height);
  } else if (metadata.fallbackBackground) {
    ctx.fillStyle = metadata.fallbackBackground;
    ctx.fillRect(drawRect.left, drawRect.top, drawRect.width, drawRect.height);
  } else {
    return false;
  }

  if (!metadata.tiles || mapTiles.length === 0) {
    return true;
  }

  const tiles = metadata.tiles;
  const tilePixelScaleX = drawRect.width / tiles.width;
  const tilePixelScaleY = drawRect.height / tiles.height;
  ctx.imageSmoothingEnabled = tilePixelScaleX < 1 || tilePixelScaleY < 1;

  mapTiles.forEach((tile) => {
    const sourceLeft = tile.column * tiles.tileSize;
    const sourceTop = tile.row * tiles.tileSize;
    const left = Math.round(drawRect.left + sourceLeft * tilePixelScaleX);
    const top = Math.round(drawRect.top + sourceTop * tilePixelScaleY);
    const right = Math.round(drawRect.left + (sourceLeft + tile.width) * tilePixelScaleX);
    const bottom = Math.round(drawRect.top + (sourceTop + tile.height) * tilePixelScaleY);

    ctx.save();
    ctx.globalAlpha = tile.opacity;
    ctx.drawImage(tile.image, left, top, right - left, bottom - top);
    ctx.restore();
  });

  return true;
};
