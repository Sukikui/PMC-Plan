import { useMemo } from 'react';
import { worldToMapPercent, type MapMetadata } from '@/lib/map/metadata';
import { mapPercentToScreenPoint, type MapSize, type MapPan, type MapViewport } from '../core/map-view';
import type { InteractiveMapPoint, PositionedMapPoint, ScreenMapPoint } from '../core/map-types';

interface UseMapPointsParams {
  points: InteractiveMapPoint[];
  metadata: MapMetadata;
  viewport: MapViewport;
  baseSize: MapSize;
  pan: MapPan;
  zoom: number;
}

export const useMapPoints = ({
  points,
  metadata,
  viewport,
  baseSize,
  pan,
  zoom,
}: UseMapPointsParams) => {
  const positionedPoints = useMemo<PositionedMapPoint[]>(() => points
    .map((point) => ({
      ...point,
      position: worldToMapPercent(metadata, { x: point.x, z: point.z }),
    }))
    .filter((point) => point.position.inBounds), [metadata, points]);

  const screenPoints = useMemo<ScreenMapPoint[]>(() => positionedPoints.map((point) => {
    return {
      ...point,
      screen: mapPercentToScreenPoint(point.position, viewport, baseSize, pan, zoom),
    };
  }), [baseSize, pan, positionedPoints, viewport, zoom]);

  const screenPointById = useMemo(
    () => new Map(screenPoints.map((point) => [point.id, point])),
    [screenPoints]
  );

  return {
    positionedPoints,
    screenPoints,
    screenPointById,
  };
};
