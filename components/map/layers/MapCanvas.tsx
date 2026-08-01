'use client';

import { useEffect } from 'react';
import type React from 'react';
import { themeColors } from '@/lib/theme-colors';
import { worldToMapPercent, type MapMetadata } from '@/lib/map/metadata';
import type { MapLineOverlay } from '@/lib/map/overlays';
import { BLOCK_GRID_MIN_PIXEL_SIZE } from '../core/map-constants';
import { getMapDrawRect } from '../core/map-geometry';
import { mapPercentToScreenPoint, type MapPan, type MapSize, type MapViewport } from '../core/map-view';
import type { LoadedMapTile } from '../hooks/useMapTiles';
import { drawMapRaster } from './map-raster';

interface MapCanvasProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  mapImage: HTMLImageElement | null;
  mapTiles: LoadedMapTile[];
  viewport: MapViewport;
  baseSize: MapSize;
  zoom: number;
  pan: MapPan;
  metadata: MapMetadata;
  lineOverlays?: MapLineOverlay[];
  showBlockGrid?: boolean;
}

export default function MapCanvas({
  canvasRef,
  mapImage,
  mapTiles,
  viewport,
  baseSize,
  zoom,
  pan,
  metadata,
  lineOverlays = [],
  showBlockGrid = true,
}: MapCanvasProps) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !viewport.width || !viewport.height || !baseSize.width || !baseSize.height) {
      return;
    }

    const pixelRatio = window.devicePixelRatio || 1;
    const canvasWidth = Math.max(1, Math.floor(viewport.width * pixelRatio));
    const canvasHeight = Math.max(1, Math.floor(viewport.height * pixelRatio));

    if (canvas.width !== canvasWidth || canvas.height !== canvasHeight) {
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
    }

    canvas.style.width = `${viewport.width}px`;
    canvas.style.height = `${viewport.height}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    ctx.clearRect(0, 0, viewport.width, viewport.height);
    const drawRect = getMapDrawRect(viewport, baseSize, zoom, pan);
    const { left: drawX, top: drawY, width: drawWidth, height: drawHeight } = drawRect;
    const blockPixelSize = (
      drawWidth / metadata.overview.width / metadata.overview.cellSize
    );

    if (!drawMapRaster(ctx, { mapImage, mapTiles, metadata, drawRect, viewport })) {
      return;
    }

    drawLineOverlays(ctx, lineOverlays, {
      metadata,
      viewport,
      baseSize,
      pan,
      zoom,
      blockPixelSize,
    });

    if (!showBlockGrid || blockPixelSize < BLOCK_GRID_MIN_PIXEL_SIZE) {
      return;
    }

    const mapBlockWidth = metadata.overview.width * metadata.overview.cellSize;
    const mapBlockHeight = metadata.overview.height * metadata.overview.cellSize;
    const minVisibleX = Math.max(0, Math.floor((0 - drawX) / blockPixelSize));
    const maxVisibleX = Math.min(mapBlockWidth, Math.ceil((viewport.width - drawX) / blockPixelSize));
    const minVisibleY = Math.max(0, Math.floor((0 - drawY) / blockPixelSize));
    const maxVisibleY = Math.min(mapBlockHeight, Math.ceil((viewport.height - drawY) / blockPixelSize));
    const visibleLeft = Math.max(drawX, 0);
    const visibleTop = Math.max(drawY, 0);
    const visibleRight = Math.min(drawX + drawWidth, viewport.width);
    const visibleBottom = Math.min(drawY + drawHeight, viewport.height);

    ctx.save();
    ctx.strokeStyle = themeColors.map.blockGridStroke;
    ctx.lineWidth = 1;
    ctx.beginPath();

    for (let blockX = minVisibleX; blockX <= maxVisibleX; blockX += 1) {
      const snappedX = Math.round(drawX + blockX * blockPixelSize) + 0.5;
      ctx.moveTo(snappedX, visibleTop);
      ctx.lineTo(snappedX, visibleBottom);
    }

    for (let blockY = minVisibleY; blockY <= maxVisibleY; blockY += 1) {
      const snappedY = Math.round(drawY + blockY * blockPixelSize) + 0.5;
      ctx.moveTo(visibleLeft, snappedY);
      ctx.lineTo(visibleRight, snappedY);
    }

    ctx.stroke();
    ctx.restore();
  }, [baseSize, canvasRef, lineOverlays, mapImage, mapTiles, metadata, pan, showBlockGrid, viewport, zoom]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 h-full w-full"
      aria-label="Carte interactive"
    />
  );
}

function drawLineOverlays(
  ctx: CanvasRenderingContext2D,
  overlays: MapLineOverlay[],
  view: {
    metadata: MapMetadata;
    viewport: MapViewport;
    baseSize: MapSize;
    pan: MapPan;
    zoom: number;
    blockPixelSize: number;
  }
) {
  if (overlays.length === 0) {
    return;
  }

  getOverlayGroups(overlays).forEach((group) => {
    ctx.save();
    ctx.globalAlpha = group.strokeOpacity;
    ctx.lineCap = 'butt';
    ctx.lineJoin = 'miter';
    ctx.strokeStyle = group.strokeStyle;
    ctx.lineWidth = Math.max(1.5, group.widthBlocks * view.blockPixelSize);
    ctx.beginPath();

    group.overlays.forEach((overlay) => {
      const screenPoints = overlay.points
        .map((point) => worldToMapPercent(view.metadata, point))
        .filter((position) => position.inBounds)
        .map((position) => mapPercentToScreenPoint(
          position,
          view.viewport,
          view.baseSize,
          view.pan,
          view.zoom
        ));

      if (screenPoints.length < 2) {
        return;
      }

      ctx.moveTo(screenPoints[0].left, screenPoints[0].top);

      for (let index = 1; index < screenPoints.length; index += 1) {
        ctx.lineTo(screenPoints[index].left, screenPoints[index].top);
      }
    });

    ctx.stroke();
    ctx.restore();
  });
}

function getOverlayGroups(overlays: MapLineOverlay[]) {
  const groups = new Map<string, {
    strokeStyle: string;
    strokeOpacity: number;
    widthBlocks: number;
    overlays: MapLineOverlay[];
  }>();

  overlays.forEach((overlay) => {
    const strokeOpacity = overlay.strokeOpacity ?? 1;
    const groupKey = `${overlay.strokeStyle}-${strokeOpacity}-${overlay.widthBlocks}`;
    const group = groups.get(groupKey);

    if (group) {
      group.overlays.push(overlay);
      return;
    }

    groups.set(groupKey, {
      strokeStyle: overlay.strokeStyle,
      strokeOpacity,
      widthBlocks: overlay.widthBlocks,
      overlays: [overlay],
    });
  });

  return Array.from(groups.values());
}
