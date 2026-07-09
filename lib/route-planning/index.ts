import {
  createPortalAddressResolver,
  createPortalCoordinatesResolver,
  getLocationKey,
  mergeWorldCoordinates,
} from './portals';
import type {
  ManualRouteCoordinates,
  PlayerRoutePosition,
  RouteBreadcrumbItem,
  RouteCoordinates,
  RouteData,
  RouteLocation,
  RouteStep,
  RouteWorldCoordinates,
} from './types';

export type {
  ManualRouteCoordinates,
  PlayerRoutePosition,
  RouteBreadcrumbItem,
  RouteCoordinates,
  RouteData,
  RouteLocation,
  RouteStep,
  RouteWorldCoordinates,
} from './types';

export const hasManualRouteCoordinates = (manualCoords?: ManualRouteCoordinates) =>
  Boolean(manualCoords?.x && manualCoords?.y && manualCoords?.z);

export const buildRouteFromParams = (
  playerPosition?: PlayerRoutePosition | null,
  manualCoords?: ManualRouteCoordinates
) => {
  if (playerPosition) {
    return `from_x=${playerPosition.x}&from_y=${playerPosition.y}&from_z=${playerPosition.z}&from_world=${playerPosition.world}`;
  }

  if (!hasManualRouteCoordinates(manualCoords)) {
    return null;
  }

  const x = Number.parseFloat(manualCoords!.x);
  const y = Number.parseFloat(manualCoords!.y);
  const z = Number.parseFloat(manualCoords!.z);

  if (Number.isNaN(x) || Number.isNaN(y) || Number.isNaN(z)) {
    throw new Error('Coordonnées invalides');
  }

  return `from_x=${x}&from_y=${y}&from_z=${z}&from_world=${manualCoords!.world}`;
};

export const getRouteTransportSteps = (route: RouteData) =>
  route.steps.filter((step) => step.type !== 'portal' && step.distance && step.distance > 0);

export const isUnknownRouteLocation = (location: RouteLocation) =>
  location.id !== undefined && location.id !== null && (!location.name || location.name === 'none');

export const isPlayerRouteLocation = (location: RouteLocation, isFirstStep: boolean) =>
  isFirstStep && !location.id;

export const formatRouteCoordinates = (coordinates: RouteCoordinates, withFloor = true) => {
  if (!withFloor) {
    return `${coordinates.x}, ${coordinates.y}, ${coordinates.z}`;
  }

  return `${Math.floor(coordinates.x)}, ${Math.floor(coordinates.y)}, ${Math.floor(coordinates.z)}`;
};

export const getRouteLocationDisplay = (location: RouteLocation) => {
  if (location.name && location.name !== 'none') {
    return location.name;
  }

  if (location.coordinates) {
    return formatRouteCoordinates(location.coordinates, false);
  }

  return 'Position inconnue';
};

export const getRouteLocationText = (
  location: RouteLocation,
  isFirstStep: boolean
) => {
  if (isUnknownRouteLocation(location)) {
    return 'Portail inconnu';
  }

  if (isPlayerRouteLocation(location, isFirstStep)) {
    return 'Position du joueur';
  }

  return getRouteLocationDisplay(location);
};

export const getRouteStepWorld = (step: RouteStep) =>
  step.type === 'nether_transport' ? 'nether' : 'overworld';

const toBreadcrumbItem = ({
  location,
  fallbackCoordinates,
  fallbackWorld,
  distanceFromPrevious,
  stepType,
  kind,
  isFirstStep = false,
  resolveAddress,
  resolveCoordinates,
}: {
  location: RouteLocation;
  fallbackCoordinates?: RouteCoordinates;
  fallbackWorld?: string;
  distanceFromPrevious?: number;
  stepType?: RouteStep['type'];
  kind: RouteBreadcrumbItem['kind'];
  isFirstStep?: boolean;
  resolveAddress?: (location: RouteLocation) => string | undefined;
  resolveCoordinates?: (
    location: RouteLocation,
    fallbackCoordinates?: RouteCoordinates,
    fallbackWorld?: string
  ) => RouteWorldCoordinates[] | undefined;
}): RouteBreadcrumbItem => {
  const coordinates = location.coordinates ?? fallbackCoordinates;
  const world = location.world ?? fallbackWorld;

  return {
    key: getLocationKey(location, fallbackCoordinates, fallbackWorld),
    location,
    label: getRouteLocationText(location, isFirstStep),
    coordinates,
    world,
    coordinateItems: resolveCoordinates?.(location, fallbackCoordinates, fallbackWorld),
    address: resolveAddress?.(location) ?? location.address,
    distanceFromPrevious,
    stepType,
    kind: isUnknownRouteLocation(location) ? 'unknown' : kind,
  };
};

export const buildRouteBreadcrumb = (route: RouteData): RouteBreadcrumbItem[] => {
  const transportSteps = getRouteTransportSteps(route);
  const resolveAddress = createPortalAddressResolver(route);
  const resolveCoordinates = createPortalCoordinatesResolver(route);

  if (transportSteps.length === 0) {
    return [
      toBreadcrumbItem({
        location: {},
        fallbackCoordinates: route.player_from.coordinates,
        fallbackWorld: route.player_from.world,
        kind: 'start',
        isFirstStep: true,
        resolveAddress,
        resolveCoordinates,
      }),
    ];
  }

  const items: RouteBreadcrumbItem[] = [];
  const pushUnique = (item: RouteBreadcrumbItem) => {
    const previous = items[items.length - 1];
    if (previous?.key === item.key) {
      previous.distanceFromPrevious = item.distanceFromPrevious ?? previous.distanceFromPrevious;
      previous.stepType = item.stepType ?? previous.stepType;
      previous.address = item.address ?? previous.address;
      previous.coordinateItems = mergeWorldCoordinates(previous.coordinateItems, item.coordinateItems);
      return;
    }

    items.push(item);
  };

  transportSteps.forEach((step, index) => {
    if (index === 0) {
      pushUnique(toBreadcrumbItem({
        location: step.from,
        fallbackCoordinates: route.player_from.coordinates,
        fallbackWorld: route.player_from.world,
        kind: 'start',
        isFirstStep: true,
        resolveAddress,
        resolveCoordinates,
      }));
    }

    pushUnique(toBreadcrumbItem({
      location: step.to,
      fallbackWorld: getRouteStepWorld(step),
      distanceFromPrevious: step.distance,
      stepType: step.type,
      kind: index === transportSteps.length - 1 ? 'destination' : 'waypoint',
      resolveAddress,
      resolveCoordinates,
    }));
  });

  return items;
};
