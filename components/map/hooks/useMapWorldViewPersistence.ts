import { useLayoutEffect, useRef, type MutableRefObject } from 'react';
import type { MapWorld } from '@/lib/map/metadata';
import { MIN_ZOOM, clamp, type MapPan } from '../core/map-view';

interface MapViewSnapshot {
  zoom: number;
  pan: MapPan;
}

interface UseMapWorldViewPersistenceOptions {
  cancelAnimation: () => void;
  clampPan: (pan: MapPan, zoom: number) => MapPan;
  commitView: (zoom: number, pan: MapPan) => void;
  maxZoom: number;
  panRef: MutableRefObject<MapPan>;
  world: MapWorld;
  zoomRef: MutableRefObject<number>;
}

export function useMapWorldViewPersistence({
  cancelAnimation,
  clampPan,
  commitView,
  maxZoom,
  panRef,
  world,
  zoomRef,
}: UseMapWorldViewPersistenceOptions) {
  const previousWorldRef = useRef(world);
  const viewByWorldRef = useRef<Partial<Record<MapWorld, MapViewSnapshot>>>({});
  const isWorldSwitching = previousWorldRef.current !== world;

  useLayoutEffect(() => {
    const previousWorld = previousWorldRef.current;
    if (previousWorld === world) return;

    cancelAnimation();
    viewByWorldRef.current[previousWorld] = {
      zoom: zoomRef.current,
      pan: panRef.current,
    };

    const savedView = viewByWorldRef.current[world] ?? {
      zoom: 1,
      pan: { x: 0, y: 0 },
    };
    const nextZoom = clamp(savedView.zoom, MIN_ZOOM, maxZoom);
    previousWorldRef.current = world;
    commitView(nextZoom, clampPan(savedView.pan, nextZoom));
  }, [
    cancelAnimation,
    clampPan,
    commitView,
    maxZoom,
    panRef,
    world,
    zoomRef,
  ]);

  return isWorldSwitching;
}
