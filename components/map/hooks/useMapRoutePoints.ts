import { useEffect, useMemo } from 'react';
import type { MapMetadata } from '@/lib/map/metadata';
import type { MapRouteMarker, MapRouteSegment } from '@/lib/map/route-path';
import {
  getActiveRoutePointState,
  getRouteLabelPoints,
} from '../core/map-route-target';
import type { ScreenMapPoint } from '../core/map-types';
import type { MapPan, MapSize, MapViewport } from '../core/map-view';

interface UseMapRoutePointsParams {
  segments: MapRouteSegment[];
  markers: MapRouteMarker[];
  screenPoints: ScreenMapPoint[];
  metadata: MapMetadata;
  viewport: MapViewport;
  baseSize: MapSize;
  pan: MapPan;
  zoom: number;
  setRouteTooltipPoints: (points: ScreenMapPoint[]) => void;
}

export const useMapRoutePoints = ({
  segments,
  markers,
  screenPoints,
  metadata,
  viewport,
  baseSize,
  pan,
  zoom,
  setRouteTooltipPoints,
}: UseMapRoutePointsParams) => {
  const pointState = useMemo(
    () => getActiveRoutePointState(segments, markers, screenPoints),
    [markers, screenPoints, segments]
  );
  const labelPoints = useMemo(() => getRouteLabelPoints(
    segments[0],
    pointState,
    { metadata, viewport, baseSize, pan, zoom }
  ), [baseSize, metadata, pan, pointState, segments, viewport, zoom]);

  useEffect(() => {
    setRouteTooltipPoints(labelPoints);
  }, [labelPoints, setRouteTooltipPoints]);

  return pointState;
};
