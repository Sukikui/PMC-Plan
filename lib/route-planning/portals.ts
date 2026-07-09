import type {
  RouteCoordinates,
  RouteData,
  RouteLocation,
  RouteWorldCoordinates,
} from './types';

const roundCoordinate = (value: number) => Math.round(value);

const normalizeLookupValue = (value: string) => value.trim().toLowerCase();

const getOppositeWorld = (world?: string) => {
  if (world === 'overworld') {
    return 'nether';
  }

  if (world === 'nether') {
    return 'overworld';
  }

  return undefined;
};

const inferPortalEndpointWorld = (
  location: RouteLocation,
  oppositeLocation: RouteLocation
) => {
  if (location.world) {
    return location.world;
  }

  if (location.address?.trim()) {
    return 'nether';
  }

  const oppositeWorld = oppositeLocation.world
    ?? (oppositeLocation.address?.trim() ? 'nether' : undefined);

  return getOppositeWorld(oppositeWorld);
};

export const getLocationKey = (
  location: RouteLocation,
  fallbackCoordinates?: RouteCoordinates,
  fallbackWorld?: string
) => {
  const coordinates = location.coordinates ?? fallbackCoordinates;
  const world = location.world ?? fallbackWorld ?? '';

  if (!coordinates) {
    return `${world}:${location.id ?? location.name ?? 'unknown'}`;
  }

  return [
    world,
    roundCoordinate(coordinates.x),
    roundCoordinate(coordinates.y),
    roundCoordinate(coordinates.z),
    location.id ?? location.name ?? '',
  ].join(':');
};

const getWorldCoordinatesKey = ({ world, coordinates }: RouteWorldCoordinates) => [
  world,
  roundCoordinate(coordinates.x),
  roundCoordinate(coordinates.y),
  roundCoordinate(coordinates.z),
].join(':');

const uniqueWorldCoordinates = (items: RouteWorldCoordinates[]) => {
  const uniqueItems = new Map<string, RouteWorldCoordinates>();

  items.forEach((item) => {
    const key = getWorldCoordinatesKey(item);
    if (!uniqueItems.has(key)) {
      uniqueItems.set(key, item);
    }
  });

  return Array.from(uniqueItems.values());
};

export const mergeWorldCoordinates = (
  base: RouteWorldCoordinates[] = [],
  next: RouteWorldCoordinates[] = []
) => uniqueWorldCoordinates([...base, ...next]);

const getPortalLookupKeys = (location: RouteLocation) => {
  const keys = new Set<string>();
  const id = location.id?.trim();
  const name = location.name?.trim();

  if (id) {
    keys.add(`id:${normalizeLookupValue(id)}`);
  }

  if (name && name !== 'none') {
    keys.add(`name:${normalizeLookupValue(name)}`);
  }

  return Array.from(keys);
};

const getPortalCoordinateLookupKeys = (
  location: RouteLocation,
  fallbackWorld?: string
) => {
  const coordinates = location.coordinates;
  const world = location.world ?? fallbackWorld;

  if (!coordinates || !world) {
    return [];
  }

  return [[
    'coordinates',
    world,
    roundCoordinate(coordinates.x),
    roundCoordinate(coordinates.y),
    roundCoordinate(coordinates.z),
  ].join(':')];
};

const getPortalLookupKeysWithCoordinates = (
  location: RouteLocation,
  fallbackWorld?: string
) => [
  ...getPortalLookupKeys(location),
  ...getPortalCoordinateLookupKeys(location, fallbackWorld),
];

const addPortalAddress = (
  addressesByPortalKey: Map<string, string>,
  location: RouteLocation,
  address?: string
) => {
  const normalizedAddress = address?.trim();
  if (!normalizedAddress) {
    return;
  }

  getPortalLookupKeys(location).forEach((key) => {
    addressesByPortalKey.set(key, normalizedAddress);
  });
};

export const createPortalAddressResolver = (route: RouteData) => {
  const addressesByPortalKey = new Map<string, string>();

  route.steps.forEach((step) => {
    if (step.type !== 'portal') {
      return;
    }

    const netherAddress = step.from.address?.trim() || step.to.address?.trim();
    if (!netherAddress) {
      return;
    }

    addPortalAddress(addressesByPortalKey, step.from, netherAddress);
    addPortalAddress(addressesByPortalKey, step.to, netherAddress);
  });

  return (location: RouteLocation) => {
    const directAddress = location.address?.trim();
    if (directAddress) {
      return directAddress;
    }

    for (const key of getPortalLookupKeys(location)) {
      const address = addressesByPortalKey.get(key);
      if (address) {
        return address;
      }
    }

    return undefined;
  };
};

const getPortalCoordinateItems = (step: RouteData['steps'][number]) => {
  const fromWorld = inferPortalEndpointWorld(step.from, step.to);
  const toWorld = inferPortalEndpointWorld(step.to, step.from);
  const coordinateItems: RouteWorldCoordinates[] = [];

  if (step.from.coordinates && fromWorld) {
    coordinateItems.push({
      world: fromWorld,
      coordinates: step.from.coordinates,
    });
  }

  if (step.to.coordinates && toWorld) {
    coordinateItems.push({
      world: toWorld,
      coordinates: step.to.coordinates,
    });
  }

  return mergeWorldCoordinates(coordinateItems);
};

const addPortalCoordinates = (
  coordinatesByPortalKey: Map<string, RouteWorldCoordinates[]>,
  location: RouteLocation,
  coordinateItems: RouteWorldCoordinates[],
  fallbackWorld?: string
) => {
  if (coordinateItems.length === 0) {
    return;
  }

  getPortalLookupKeysWithCoordinates(location, fallbackWorld).forEach((key) => {
    const existingCoordinateItems = coordinatesByPortalKey.get(key);
    coordinatesByPortalKey.set(
      key,
      mergeWorldCoordinates(existingCoordinateItems, coordinateItems)
    );
  });
};

export const createPortalCoordinatesResolver = (route: RouteData) => {
  const coordinatesByPortalKey = new Map<string, RouteWorldCoordinates[]>();

  route.steps.forEach((step) => {
    if (step.type !== 'portal') {
      return;
    }

    const coordinateItems = getPortalCoordinateItems(step);
    const fromWorld = inferPortalEndpointWorld(step.from, step.to);
    const toWorld = inferPortalEndpointWorld(step.to, step.from);

    addPortalCoordinates(coordinatesByPortalKey, step.from, coordinateItems, fromWorld);
    addPortalCoordinates(coordinatesByPortalKey, step.to, coordinateItems, toWorld);
  });

  return (
    location: RouteLocation,
    fallbackCoordinates?: RouteCoordinates,
    fallbackWorld?: string
  ) => {
    for (const key of getPortalLookupKeysWithCoordinates(location, fallbackWorld)) {
      const coordinateItems = coordinatesByPortalKey.get(key);
      if (coordinateItems?.length) {
        return coordinateItems;
      }
    }

    const coordinates = location.coordinates ?? fallbackCoordinates;
    const world = location.world ?? fallbackWorld;

    if (!coordinates || !world) {
      return undefined;
    }

    return [{ world, coordinates }];
  };
};
