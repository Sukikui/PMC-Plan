import { prisma } from '@/lib/prisma';
import { DEFAULT_PLACE_CATEGORY, isPlaceCategory } from '@/lib/place/categories';
import { normalizePlaceImages } from '@/lib/place/images';
import { resolvePlaceDiscordUrl } from '@/lib/place/discord';
import { normalizeLinkedPortalIdentities } from '@/lib/portal/linked-portals';
import {
  publicMapEntryInclude,
  toMapEntryAccess,
  toMapEntryEditor,
  toMapEntryPrimaryManager,
  toMapEntrySpace,
  toMinecraftOwners,
} from '@/lib/map-entry/serialization';
import { toTradeOffer } from './trade';
import type { Place, Portal, TradeOffer } from '@/lib/api/types';

export async function loadPortals(): Promise<Portal[]> {
  const portalRecords = await prisma.portal.findMany({
    include: {
      mapEntry: {
        include: publicMapEntryInclude,
      },
    },
    orderBy: [{ name: 'asc' }],
  });

  const portals = portalRecords.map((portal): Portal => {
    const access = toMapEntryAccess(portal.mapEntry);
    return {
      id: portal.slug,
      slug: portal.slug,
      name: portal.name,
      world: portal.world,
      coordinates: {
        x: portal.coordX,
        y: portal.coordY,
        z: portal.coordZ,
      },
      description: portal.description ?? null,
      address: portal.address ?? '',
      owners: toMinecraftOwners(portal.mapEntry),
      space: toMapEntrySpace(portal.mapEntry),
      lastEditor: toMapEntryEditor(portal.mapEntry),
      primaryManager: toMapEntryPrimaryManager(portal.mapEntry),
      'nether-associate': null,
      ...access,
      createdAt: portal.createdAt,
      updatedAt: portal.updatedAt,
    };
  });

  return normalizeLinkedPortalIdentities(portals);
}

export async function loadPlaces(): Promise<Place[]> {
  const placeRecords = await prisma.place.findMany({
    include: {
      tradeOffers: {
        include: {
          items: true,
        },
      },
      mapEntry: {
        include: publicMapEntryInclude,
      },
    },
    orderBy: [{ name: 'asc' }],
  });

  return placeRecords.map((place) => {
    const trades = place.tradeOffers
      .map((offer) => toTradeOffer(offer))
      .filter((offer): offer is TradeOffer => offer !== null);
    const images = normalizePlaceImages(place.images);
    const access = toMapEntryAccess(place.mapEntry);
    const space = toMapEntrySpace(place.mapEntry);

    return {
      id: place.slug,
      name: place.name,
      world: place.world,
      coordinates: {
        x: place.coordX,
        y: place.coordY,
        z: place.coordZ,
      },
      description: place.description ?? null,
      address: place.address ?? null,
      category: isPlaceCategory(place.category) ? place.category : DEFAULT_PLACE_CATEGORY,
      images,
      tags: place.tags,
      owners: toMinecraftOwners(place.mapEntry),
      space,
      lastEditor: toMapEntryEditor(place.mapEntry),
      primaryManager: toMapEntryPrimaryManager(place.mapEntry),
      discord: resolvePlaceDiscordUrl(place.discordUrl, space),
      discordOverride: place.discordUrl ?? null,
      trade: trades.length > 0 ? trades : null,
      ...access,
      createdAt: place.createdAt,
      updatedAt: place.updatedAt,
    };
  });
}
