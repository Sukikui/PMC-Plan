import { useMemo } from 'react';
import type {
  MapMetadata,
  MapWorld,
} from '@/lib/map/metadata';
import {
  getSelectedMapRoute,
  type MapRoutePath,
  type MapRouteSegment,
} from '@/lib/map/route-path';
import type { MapPan, MapSize, MapViewport } from '../core/map-view';
import { useMapRouteFocus } from './useMapRouteFocus';

interface UseMapRouteParams {
  routePath: MapRoutePath | null;
  activeSegmentId?: string | null;
  world: MapWorld;
  isBlocked: boolean;
  metadata: MapMetadata;
  viewport: MapViewport;
  baseSize: MapSize;
  maxZoom: number;
  clampPan: (pan: MapPan, zoom: number) => MapPan;
  animateView: (zoom: number, pan: MapPan, onComplete?: () => void) => void;
  clearPointTooltip: () => void;
  onFocusComplete?: (segment: MapRouteSegment) => void;
}

export const useMapRoute = ({
  routePath,
  activeSegmentId,
  world,
  isBlocked,
  metadata,
  viewport,
  baseSize,
  maxZoom,
  clampPan,
  animateView,
  clearPointTooltip,
  onFocusComplete,
}: UseMapRouteParams) => {
  const route = useMemo(
    () => getSelectedMapRoute(routePath, activeSegmentId, world),
    [activeSegmentId, routePath, world]
  );
  const activeSegment = route.segments[0];
  const focusPoints = useMemo(
    () => route.segments.flatMap((segment) => segment.points),
    [route.segments]
  );
  const focusKey = activeSegment && routePath
    ? `${routePath.key}:${activeSegment.id}`
    : undefined;

  useMapRouteFocus({
    focusKey,
    points: focusPoints,
    isBlocked,
    metadata,
    viewport,
    baseSize,
    maxZoom,
    clampPan,
    animateView,
    clearPointTooltip,
    onFocusComplete: () => {
      if (activeSegment) {
        onFocusComplete?.(activeSegment);
      }
    },
  });

  return {
    ...route,
    focusKey,
  };
};
