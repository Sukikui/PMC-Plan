import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { MapMetadata } from '@/lib/map/metadata';
import { FOCUS_ANIMATION_DURATION_MS, PAN_OVERSCROLL_VISIBLE_RATIO } from '../core/map-constants';
import {
  MIN_ZOOM,
  clamp,
  easeInOutSine,
  getFittedMapSize,
  getMaxZoom,
  lerp,
  type MapPan,
} from '../core/map-view';

export const useMapView = (metadata: MapMetadata) => {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<MapPan>({ x: 0, y: 0 });
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const panRef = useRef(pan);
  const zoomRef = useRef(zoom);
  const queuedPanRef = useRef<MapPan>(pan);
  const panFrameRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const baseSize = useMemo(() => getFittedMapSize(viewport, metadata), [viewport, metadata]);
  const maxZoom = useMemo(() => getMaxZoom(baseSize.width, metadata), [baseSize.width, metadata]);
  const mapCellPixelSize = baseSize.width > 0 ? (baseSize.width * zoom) / metadata.width : 0;

  const clampPan = useCallback((nextPan: MapPan, nextZoom: number) => {
    if (!viewport.width || !viewport.height || !baseSize.width || !baseSize.height) {
      return nextPan;
    }

    const scaledWidth = baseSize.width * nextZoom;
    const scaledHeight = baseSize.height * nextZoom;
    const visibleWidth = Math.min(viewport.width, scaledWidth);
    const visibleHeight = Math.min(viewport.height, scaledHeight);
    const overscrollX = visibleWidth * PAN_OVERSCROLL_VISIBLE_RATIO;
    const overscrollY = visibleHeight * PAN_OVERSCROLL_VISIBLE_RATIO;
    const maxX = Math.max(0, (scaledWidth - viewport.width) / 2) + overscrollX;
    const maxY = Math.max(0, (scaledHeight - viewport.height) / 2) + overscrollY;

    return {
      x: clamp(nextPan.x, -maxX, maxX),
      y: clamp(nextPan.y, -maxY, maxY),
    };
  }, [baseSize.height, baseSize.width, viewport.height, viewport.width]);

  const commitPan = useCallback((nextPan: MapPan) => {
    panRef.current = nextPan;
    queuedPanRef.current = nextPan;

    if (panFrameRef.current) {
      return;
    }

    panFrameRef.current = requestAnimationFrame(() => {
      panFrameRef.current = null;
      setPan(queuedPanRef.current);
    });
  }, []);

  const commitView = useCallback((nextZoom: number, nextPan: MapPan) => {
    zoomRef.current = nextZoom;
    panRef.current = nextPan;
    queuedPanRef.current = nextPan;
    setZoom(nextZoom);
    setPan(nextPan);
  }, []);

  const cancelAnimation = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);

  const animateView = useCallback((nextZoom: number, nextPan: MapPan, onComplete?: () => void) => {
    cancelAnimation();

    const startZoom = zoomRef.current;
    const startPan = panRef.current;
    const startedAt = performance.now();

    const step = (timestamp: number) => {
      const progress = clamp((timestamp - startedAt) / FOCUS_ANIMATION_DURATION_MS, 0, 1);
      const easedProgress = easeInOutSine(progress);
      const animatedZoom = clamp(lerp(startZoom, nextZoom, easedProgress), MIN_ZOOM, maxZoom);
      const animatedPan = {
        x: lerp(startPan.x, nextPan.x, easedProgress),
        y: lerp(startPan.y, nextPan.y, easedProgress),
      };

      commitView(animatedZoom, clampPan(animatedPan, animatedZoom));

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(step);
        return;
      }

      animationFrameRef.current = null;
      commitView(nextZoom, nextPan);
      onComplete?.();
    };

    animationFrameRef.current = requestAnimationFrame(step);
  }, [cancelAnimation, clampPan, commitView, maxZoom]);

  useEffect(() => {
    panRef.current = pan;
    queuedPanRef.current = pan;
  }, [pan]);

  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  useEffect(() => {
    const node = viewportRef.current;
    if (!node) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setViewport({ width, height });
      }
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const nextZoom = clamp(zoomRef.current, MIN_ZOOM, maxZoom);
    commitView(nextZoom, clampPan(panRef.current, nextZoom));
  }, [clampPan, commitView, maxZoom]);

  useEffect(() => () => {
    if (panFrameRef.current) {
      cancelAnimationFrame(panFrameRef.current);
    }
    cancelAnimation();
  }, [cancelAnimation]);

  return {
    viewportRef,
    viewport,
    baseSize,
    zoom,
    pan,
    maxZoom,
    mapCellPixelSize,
    panRef,
    zoomRef,
    clampPan,
    commitPan,
    commitView,
    animateView,
    cancelAnimation,
  };
};
