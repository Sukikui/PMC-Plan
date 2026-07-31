'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';
import MinecraftHeadImage from '@/components/ui/MinecraftHeadImage';
import { worldToMapPercent, type MapCoordinate, type MapMetadata } from '@/lib/map/metadata';
import type { MapRouteMarker, MapRouteSegment } from '@/lib/map/route-path';
import {
  easeInOutSine,
  mapPercentToScreenPoint,
  type MapPan,
  type MapSize,
  type MapViewport,
} from '../core/map-view';
import {
  ROUTE_PLAYER_MARKER_SIZE_PX,
  getScaledMapIconSizePx,
} from '../core/map-constants';
import {
  drawRouteMarkers,
  drawRoutePath,
  getScreenSegmentsLength,
  resizeRouteCanvas,
} from './route-canvas-drawing';

interface RouteMapCanvasProps {
  animationKey: string;
  segments: MapRouteSegment[];
  markers: MapRouteMarker[];
  metadata: MapMetadata;
  viewport: MapViewport;
  baseSize: MapSize;
  zoom: number;
  iconScale: number;
  pan: MapPan;
  playerIdentifier?: string | null;
  fallbackPlayerIdentifier?: string | null;
}

const MIN_DRAW_DURATION_MS = 650;
const MAX_DRAW_DURATION_MS = 1100;
const DRAW_DURATION_PER_PIXEL = 0.65;

export default function RouteMapCanvas({
  animationKey,
  segments,
  markers,
  metadata,
  viewport,
  baseSize,
  zoom,
  iconScale,
  pan,
  playerIdentifier,
  fallbackPlayerIdentifier,
}: RouteMapCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<{ key: string; startedAt: number } | undefined>(undefined);
  const projectPoint = useCallback((point: MapCoordinate) => mapPercentToScreenPoint(
    worldToMapPercent(metadata, point),
    viewport,
    baseSize,
    pan,
    zoom
  ), [baseSize, metadata, pan, viewport, zoom]);
  const screenSegments = useMemo(() => segments.map((segment) => ({
    ...segment,
    points: segment.points.map(projectPoint),
  })), [projectPoint, segments]);
  const screenMarkers = useMemo(() => markers.map((marker) => ({
    ...marker,
    point: projectPoint(marker.point),
  })), [markers, projectPoint]);
  const playerMarker = screenMarkers.find((marker) => marker.kind === 'start');
  const playerMarkerSize = getScaledMapIconSizePx(ROUTE_PLAYER_MARKER_SIZE_PX, iconScale);
  const canvasMarkers = useMemo(
    () => screenMarkers.filter((marker) => marker.kind !== 'start'),
    [screenMarkers]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (
      !canvas ||
      !viewport.width ||
      !viewport.height ||
      !baseSize.width ||
      !baseSize.height
    ) {
      return;
    }

    const pixelRatio = window.devicePixelRatio || 1;
    resizeRouteCanvas(canvas, viewport, pixelRatio);
    const context = canvas.getContext('2d');
    if (!context) return;

    const totalLength = getScreenSegmentsLength(screenSegments);
    if (!totalLength) {
      context.clearRect(0, 0, viewport.width, viewport.height);
      return;
    }

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (animationRef.current?.key !== animationKey) {
      animationRef.current = { key: animationKey, startedAt: performance.now() };
    }
    const startedAt = animationRef.current.startedAt;
    const duration = Math.min(
      MAX_DRAW_DURATION_MS,
      Math.max(MIN_DRAW_DURATION_MS, totalLength * DRAW_DURATION_PER_PIXEL)
    );
    let animationFrameId = 0;

    const drawFrame = (timestamp: number) => {
      const rawProgress = reduceMotion
        ? 1
        : Math.min(Math.max((timestamp - startedAt) / duration, 0), 1);
      const progress = easeInOutSine(rawProgress);
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      context.clearRect(0, 0, viewport.width, viewport.height);
      drawRoutePath(
        context,
        screenSegments,
        totalLength * progress,
        timestamp,
        rawProgress >= 1 && !reduceMotion
      );
      drawRouteMarkers(
        context,
        canvasMarkers,
        timestamp,
        rawProgress >= 1
      );

      if (!reduceMotion) {
        animationFrameId = window.requestAnimationFrame(drawFrame);
      }
    };

    animationFrameId = window.requestAnimationFrame(drawFrame);
    return () => window.cancelAnimationFrame(animationFrameId);
  }, [
    animationKey,
    baseSize,
    canvasMarkers,
    screenSegments,
    viewport,
  ]);

  return (
    <>
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[5] h-full w-full"
      />
      {playerMarker && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute z-[6]"
          style={{
            height: `${playerMarkerSize}px`,
            left: `${playerMarker.point.left}px`,
            top: `${playerMarker.point.top}px`,
            transform: 'translate3d(-50%, -50%, 0)',
            width: `${playerMarkerSize}px`,
          }}
        >
          <MinecraftHeadImage
            alt=""
            className="h-full w-full object-contain"
            crossOrigin="anonymous"
            draggable={false}
            fallbackPlayerIdentifier={fallbackPlayerIdentifier}
            loading="eager"
            playerIdentifier={playerIdentifier}
          />
        </div>
      )}
    </>
  );
}
