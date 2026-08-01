import type { MapMetadata } from '@/lib/map/metadata';
import type { LoadedMapTile } from '../hooks/useMapTiles';
import type { MapDrawRect } from '../core/map-geometry';
import type { MapViewport } from '../core/map-view';

interface DrawMapRasterOptions {
  mapImage: HTMLImageElement | null;
  mapTiles: LoadedMapTile[];
  metadata: MapMetadata;
  drawRect: MapDrawRect;
  viewport: MapViewport;
}

interface ImageSize {
  width: number;
  height: number;
}

export interface ClippedImageDraw {
  source: MapDrawRect;
  destination: MapDrawRect;
}

export const drawMapRaster = (
  ctx: CanvasRenderingContext2D,
  { mapImage, mapTiles, metadata, drawRect, viewport }: DrawMapRasterOptions
) => {
  if (mapImage) {
    ctx.imageSmoothingEnabled = drawRect.width < metadata.overview.width;
    drawVisibleImage(ctx, mapImage, drawRect, viewport);
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

    const destination = { left, top, width: right - left, height: bottom - top };
    const draw = getClippedImageDraw(
      { width: tile.image.naturalWidth, height: tile.image.naturalHeight },
      destination,
      viewport
    );
    if (draw) {
      ctx.save();
      ctx.globalAlpha = tile.opacity;
      ctx.drawImage(
        tile.image,
        draw.source.left,
        draw.source.top,
        draw.source.width,
        draw.source.height,
        draw.destination.left,
        draw.destination.top,
        draw.destination.width,
        draw.destination.height
      );
      ctx.restore();
    }
  });

  return true;
};

export const getClippedImageDraw = (
  source: ImageSize,
  destination: MapDrawRect,
  viewport: MapViewport
): ClippedImageDraw | null => {
  if (source.width <= 0 || source.height <= 0 || destination.width <= 0 || destination.height <= 0) {
    return null;
  }

  const left = Math.max(0, destination.left);
  const top = Math.max(0, destination.top);
  const right = Math.min(viewport.width, destination.left + destination.width);
  const bottom = Math.min(viewport.height, destination.top + destination.height);
  if (right <= left || bottom <= top) {
    return null;
  }

  const sourceScaleX = source.width / destination.width;
  const sourceScaleY = source.height / destination.height;
  return {
    source: {
      left: (left - destination.left) * sourceScaleX,
      top: (top - destination.top) * sourceScaleY,
      width: (right - left) * sourceScaleX,
      height: (bottom - top) * sourceScaleY,
    },
    destination: {
      left,
      top,
      width: right - left,
      height: bottom - top,
    },
  };
};

const drawVisibleImage = (
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  destination: MapDrawRect,
  viewport: MapViewport
) => {
  const draw = getClippedImageDraw(
    { width: image.naturalWidth, height: image.naturalHeight },
    destination,
    viewport
  );
  if (!draw) return;

  ctx.drawImage(
    image,
    draw.source.left,
    draw.source.top,
    draw.source.width,
    draw.source.height,
    draw.destination.left,
    draw.destination.top,
    draw.destination.width,
    draw.destination.height
  );
};
