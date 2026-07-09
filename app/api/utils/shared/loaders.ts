import { prisma } from '@/lib/prisma';
import { DEFAULT_PLACE_CATEGORY, isPlaceCategory } from '@/lib/place/categories';
import { normalizePlaceImages } from '@/lib/place/images';
import { toTradeOffer } from './trade';
import type { Place, Portal, TradeOffer } from './types';

export async function loadPortals(): Promise<Portal[]> {
  const portalRecords = await prisma.portal.findMany({
    where: { status: 'approved' },
    orderBy: [{ name: 'asc' }],
  });

  return portalRecords.map((portal): Portal => ({
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
    owners: portal.ownerNames,
    'nether-associate': null,
    createdById: portal.createdById,
    createdAt: portal.createdAt,
    updatedAt: portal.updatedAt,
  }));
}

export async function loadPlaces(): Promise<Place[]> {
  const placeRecords = await prisma.place.findMany({
    where: { status: 'approved' },
    include: {
      tradeOffers: {
        include: {
          items: true,
        },
      },
    },
    orderBy: [{ name: 'asc' }],
  });

  return placeRecords.map((place) => {
    const trades = place.tradeOffers
      .map((offer) => toTradeOffer(offer))
      .filter((offer): offer is TradeOffer => offer !== null);
    const images = normalizePlaceImages(place.images);

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
      owners: place.ownerNames ?? [],
      discord: place.discordUrl ?? null,
      trade: trades.length > 0 ? trades : null,
      createdById: place.createdById,
      createdAt: place.createdAt,
      updatedAt: place.updatedAt,
    };
  });
}
