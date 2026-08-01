import { revalidateTag, unstable_cache } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { normalizeLinkedPortalIdentities } from '@/lib/portal/linked-portals';
import type { RouteDataSet, RouteEntity, RoutePortal } from '../route-types';

const ROUTE_DATA_CACHE_TAG = 'route-data';

const routeEntitySelect = {
  slug: true,
  name: true,
  world: true,
  coordX: true,
  coordY: true,
  coordZ: true,
  address: true,
} as const;

const queryRouteData = async (): Promise<RouteDataSet> => {
  const [placeRecords, portalRecords] = await Promise.all([
    prisma.place.findMany({ select: routeEntitySelect }),
    prisma.portal.findMany({
      select: {
        ...routeEntitySelect,
        mapEntryId: true,
      },
    }),
  ]);

  const places = placeRecords.map((place): RouteEntity => ({
    id: place.slug,
    name: place.name,
    world: place.world,
    coordinates: {
      x: place.coordX,
      y: place.coordY,
      z: place.coordZ,
    },
    address: place.address,
  }));

  const portals = portalRecords.map((portal): RoutePortal => ({
    id: portal.slug,
    slug: portal.slug,
    name: portal.name,
    world: portal.world,
    coordinates: {
      x: portal.coordX,
      y: portal.coordY,
      z: portal.coordZ,
    },
    address: portal.address ?? '',
    mapEntryId: portal.mapEntryId,
  }));

  return {
    places,
    portals: normalizeLinkedPortalIdentities(portals),
  };
};

const loadCachedRouteData = unstable_cache(
  queryRouteData,
  ['route-data-v1'],
  { revalidate: 60, tags: [ROUTE_DATA_CACHE_TAG] },
);

export const loadRouteData = () => loadCachedRouteData();

export const invalidateRouteData = () => revalidateTag(ROUTE_DATA_CACHE_TAG);
