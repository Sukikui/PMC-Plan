import { prisma } from '@/lib/prisma';
import { cacheDatabaseQuery } from '@/lib/cache/database-cache';
import { contentCacheTags } from '@/lib/content/cache-tags';
import { publicMapEntryInclude } from '@/lib/map-entry/serialization';
import {
  normalizeLinkedPortalIdentities,
} from '@/lib/portal/linked-portals';
import type {
  MapContentResponse,
  PlaceSummary,
  PortalSummary,
} from './types';

export const loadMapContentUncached = async (): Promise<MapContentResponse> => {
  const [placeRecords, portalRecords] = await Promise.all([
    prisma.place.findMany({
      orderBy: { name: 'asc' },
      select: {
        address: true,
        category: true,
        coordX: true,
        coordY: true,
        coordZ: true,
        description: true,
        mapEntryId: true,
        name: true,
        slug: true,
        tags: true,
        world: true,
        mapEntry: {
          select: {
            color: true,
            images: true,
            space: publicMapEntryInclude.space,
          },
        },
      },
    }),
    prisma.portal.findMany({
      orderBy: { name: 'asc' },
      select: {
        address: true,
        coordX: true,
        coordY: true,
        coordZ: true,
        description: true,
        mapEntryId: true,
        name: true,
        slug: true,
        world: true,
        mapEntry: {
          select: {
            color: true,
            images: true,
            space: publicMapEntryInclude.space,
          },
        },
      },
    }),
  ]);

  const places = placeRecords.map((place): PlaceSummary => ({
    color: place.mapEntry.color,
    id: place.slug,
    name: place.name,
    world: place.world,
    coordinates: {
      x: place.coordX,
      y: place.coordY,
      z: place.coordZ,
    },
    description: place.description,
    address: place.address,
    category: place.category,
    previewImage: place.mapEntry.images[0] ?? null,
    tags: place.tags,
    mapEntryId: place.mapEntryId,
    space: place.mapEntry.space,
  }));
  const portals = normalizeLinkedPortalIdentities(portalRecords.map(
    (portal): PortalSummary => ({
      color: portal.mapEntry.color,
      id: portal.slug,
      slug: portal.slug,
      name: portal.name,
      world: portal.world,
      coordinates: {
        x: portal.coordX,
        y: portal.coordY,
        z: portal.coordZ,
      },
      description: portal.description,
      address: portal.address ?? '',
      mapEntryId: portal.mapEntryId,
      previewImage: portal.mapEntry.images[0] ?? null,
      space: portal.mapEntry.space,
      'nether-associate': null,
    }),
  ));

  return { places, portals };
};

const loadCachedMapContent = cacheDatabaseQuery(
  loadMapContentUncached,
  ['public-map-content-v3'],
  { revalidate: 300, tags: [contentCacheTags.map] },
);

export const loadMapContent = () => loadCachedMapContent();
