import {
  worldToMapPercent,
  type MapCoordinate,
  type MapMetadata,
} from '@/lib/map/metadata';
import type { MapRouteMarker, MapRouteSegment } from '@/lib/map/route-path';
import type { ScreenMapPoint } from './map-types';
import {
  mapPercentToScreenPoint,
  type MapPan,
  type MapSize,
  type MapViewport,
} from './map-view';

const COORDINATE_MATCH_TOLERANCE = 0.001;

export const findRouteTargetPoint = (
  segment: MapRouteSegment | undefined,
  points: ScreenMapPoint[]
) => {
  const target = segment?.points.at(-1);
  if (!segment || !target) return undefined;

  const idSuffix = segment.target.id ? `-${segment.target.id}` : undefined;

  return points.find((point) => (
    matchesCoordinate(point, target) &&
    (!idSuffix || point.id.endsWith(idSuffix))
  )) ?? points.find((point) => matchesCoordinate(point, target));
};

export const getActiveRoutePointState = (
  segments: MapRouteSegment[],
  markers: MapRouteMarker[],
  points: ScreenMapPoint[]
) => {
  const segment = segments[0];
  if (!segment) {
    return { targetPoint: undefined, pointIds: undefined };
  }

  const targetPoint = findRouteTargetPoint(segment, points);
  const sourcePoint = markers[0]?.kind === 'transition'
    ? findRouteSourcePoint(segment.points[0], points)
    : undefined;
  const pointIds = new Set<string>();
  if (sourcePoint) pointIds.add(sourcePoint.id);
  if (targetPoint) pointIds.add(targetPoint.id);

  return { sourcePoint, targetPoint, pointIds };
};

export const getRouteLabelPoints = (
  segment: MapRouteSegment | undefined,
  pointState: ReturnType<typeof getActiveRoutePointState>,
  view: {
    metadata: MapMetadata;
    viewport: MapViewport;
    baseSize: MapSize;
    pan: MapPan;
    zoom: number;
  }
) => {
  if (!segment) return [];

  const targetPoint = pointState.targetPoint
    ? { ...pointState.targetPoint, label: segment.target.label }
    : toRouteLabelPoint(segment, 'target', view);
  if (segment.sequence === 0) return [targetPoint];

  const sourcePoint = pointState.sourcePoint
    ? { ...pointState.sourcePoint, label: segment.source.label }
    : toRouteLabelPoint(segment, 'source', view);
  return [sourcePoint, targetPoint];
};

const findRouteSourcePoint = (
  source: MapCoordinate,
  points: ScreenMapPoint[]
) => points.find((point) => (
  point.kind !== 'place' && matchesCoordinate(point, source)
)) ?? points.find((point) => matchesCoordinate(point, source));

const matchesCoordinate = (
  point: ScreenMapPoint,
  coordinate: MapCoordinate
) => (
  Math.abs(point.x - coordinate.x) < COORDINATE_MATCH_TOLERANCE &&
  Math.abs(point.z - coordinate.z) < COORDINATE_MATCH_TOLERANCE
);

const toRouteLabelPoint = (
  segment: MapRouteSegment,
  endpoint: 'source' | 'target',
  view: Parameters<typeof getRouteLabelPoints>[2]
): ScreenMapPoint => {
  const point = endpoint === 'source' ? segment.points[0] : segment.points.at(-1)!;
  const details = segment[endpoint];

  return {
    id: `${segment.id}-${endpoint}`,
    ...point,
    kind: 'route',
    label: details.label,
    screen: mapPercentToScreenPoint(
      worldToMapPercent(view.metadata, point),
      view.viewport,
      view.baseSize,
      view.pan,
      view.zoom
    ),
  };
};
