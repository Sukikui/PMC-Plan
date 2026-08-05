import {
  NETHER_MAP_WORLD,
  OVERWORLD_MAP_WORLD,
  type MapCoordinate,
  type MapWorld,
} from '@/lib/map/metadata';
import {
  getRouteLocationText,
  type RouteCoordinates,
  type RouteData,
  type RouteLocation,
  type RouteStep,
} from '@/lib/route-planning';

export type MapRouteMarkerKind = 'start' | 'transition' | 'destination';
type MapRouteTargetKind = 'portal' | 'destination';

export interface MapRouteSegment {
  id: string;
  world: MapWorld;
  points: MapCoordinate[];
  sequence: number;
  source: {
    id?: string;
    label: string;
  };
  target: {
    id?: string;
    label: string;
    kind: MapRouteTargetKind;
  };
}

export interface MapRouteMarker {
  id: string;
  world: MapWorld;
  point: MapCoordinate;
  kind: MapRouteMarkerKind;
  sequence: number;
}

export interface MapRoutePath {
  key: string;
  segments: MapRouteSegment[];
}

export const buildMapRoutePath = (route: RouteData): MapRoutePath | null => {
  const transportSegments = route.steps.flatMap((step, stepIndex) => {
    if (step.type === 'portal') return [];

    const from = getLocationCoordinates(
      step.from,
      stepIndex === 0 ? route.player_from.coordinates : undefined
    );
    const to = getLocationCoordinates(step.to);
    if (!from || !to) return [];

    const points = deduplicateMapPoints(
      (step.path && step.path.length > 1 ? step.path : [from, to]).map(toMapPoint)
    );
    if (points.length < 2) return [];

    return [{
      id: `route-segment-${stepIndex}`,
      world: getTransportWorld(step),
      points,
      sequence: stepIndex,
      sourceLocation: step.from,
      targetLocation: step.to,
    }];
  });

  if (transportSegments.length === 0) return null;

  const segments = transportSegments.map((segment, index): MapRouteSegment => {
    const { sourceLocation, targetLocation, ...routeSegment } = segment;

    return {
      ...routeSegment,
      source: {
        id: sourceLocation.id,
        label: getRouteLocationText(sourceLocation, segment.sequence === 0),
      },
      target: {
        id: targetLocation.id,
        label: getRouteLocationText(targetLocation, false),
        kind: index === transportSegments.length - 1 ? 'destination' : 'portal',
      },
    };
  });

  return {
    key: getStableRouteKey(route),
    segments,
  };
};

export const getSelectedMapRoute = (
  routePath: MapRoutePath | null,
  segmentId: string | null | undefined,
  world: MapWorld
) => {
  if (!routePath || !segmentId) {
    return { segments: [], markers: [] };
  }

  const segmentIndex = routePath.segments.findIndex((segment) => segment.id === segmentId);
  const segment = routePath.segments[segmentIndex];
  if (!segment || segment.world !== world) {
    return { segments: [], markers: [] };
  }

  return {
    segments: [segment],
    markers: [
      toMarker(
        segment,
        segmentIndex === 0 ? 'start' : 'transition',
        segment.points[0],
        'start'
      ),
      toMarker(
        segment,
        segmentIndex === routePath.segments.length - 1 ? 'destination' : 'transition',
        segment.points.at(-1)!,
        'destination'
      ),
    ],
  };
};

const toMarker = (
  segment: MapRouteSegment,
  kind: MapRouteMarkerKind,
  point: MapCoordinate,
  suffix: string
): MapRouteMarker => ({
  id: `${segment.id}-${suffix}`,
  world: segment.world,
  point,
  kind,
  sequence: segment.sequence,
});

const getStableRouteKey = (route: RouteData) => route.steps
  .map((step, index) => [
    step.type,
    index === 0 ? 'origin' : getLocationIdentity(step.from),
    getLocationIdentity(step.to),
  ].join(':'))
  .join('|');

const getLocationIdentity = (location: RouteLocation) => {
  if (location.id) return `id-${location.id}`;
  if (location.name) return `name-${location.name}`;

  const coordinates = getLocationCoordinates(location);
  return coordinates
    ? `coordinates-${coordinates.x}-${coordinates.y}-${coordinates.z}`
    : 'unknown';
};

const getTransportWorld = (step: RouteStep): MapWorld => (
  step.type === 'nether_transport' ? NETHER_MAP_WORLD : OVERWORLD_MAP_WORLD
);

const getLocationCoordinates = (
  location: RouteLocation,
  fallback?: RouteCoordinates
): RouteCoordinates | undefined => location.coordinates ?? fallback;

const toMapPoint = ({ x, z }: RouteCoordinates): MapCoordinate => ({ x, z });

const sameMapPoint = (first: MapCoordinate, second: MapCoordinate) => (
  first.x === second.x && first.z === second.z
);

const deduplicateMapPoints = (points: MapCoordinate[]) => points.filter((point, index) => (
  index === 0 || !sameMapPoint(point, points[index - 1])
));
