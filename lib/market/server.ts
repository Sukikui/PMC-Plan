import type { Prisma } from '@prisma/client';
import { unstable_cache } from 'next/cache';
import type { PaginatedResponse } from '@/lib/api/pagination';
import { toPaginationMeta } from '@/lib/api/pagination';
import { contentCacheTags } from '@/lib/content/cache-tags';
import { prisma } from '@/lib/prisma';
import { publicMapEntryInclude } from '@/lib/map-entry/serialization';
import { prioritizePrimaryManagerOwner } from '@/lib/map-entry/owners';
import { toTradeOffer } from '@/app/api/utils/shared/trade';
import type { GlobalOffer } from '@/lib/trade/global-offers';
import { validTradeOfferWhere } from '@/lib/trade/query';

const offerInclude = {
  items: true,
  place: {
    select: {
      name: true,
      slug: true,
      mapEntry: {
        select: {
          primaryManager: {
            select: {
              minecraftProfile: { select: { uuid: true } },
            },
          },
          owners: publicMapEntryInclude.owners,
          space: publicMapEntryInclude.space,
        },
      },
    },
  },
} satisfies Prisma.TradeOfferInclude;

type OfferRecord = Prisma.TradeOfferGetPayload<{ include: typeof offerInclude }>;

export async function listMarketOffers({
  page,
  pageSize,
  query,
}: {
  page: number;
  pageSize: number;
  query: string;
}): Promise<PaginatedResponse<GlobalOffer>> {
  const where = getOfferWhere(query);
  const [records, total] = await prisma.$transaction([
    prisma.tradeOffer.findMany({
      where,
      include: offerInclude,
      orderBy: [{ place: { name: 'asc' } }, { uid: 'asc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.tradeOffer.count({ where }),
  ]);
  return {
    items: records.flatMap(toGlobalOffer),
    pagination: toPaginationMeta(page, pageSize, total),
  };
}

const loadCachedOffers = unstable_cache(
  (page: number, pageSize: number, query: string) => listMarketOffers({
    page,
    pageSize,
    query,
  }),
  ['market-offers-v1'],
  { revalidate: 300, tags: [contentCacheTags.market] },
);

export const loadMarketOffers = (
  page: number,
  pageSize: number,
  query: string,
) => loadCachedOffers(page, pageSize, query);

function getOfferWhere(query: string): Prisma.TradeOfferWhereInput {
  if (!query) return validTradeOfferWhere;
  return {
    ...validTradeOfferWhere,
    OR: [
      { description: { contains: query, mode: 'insensitive' } },
      { items: { some: { itemId: { contains: query, mode: 'insensitive' } } } },
      { items: { some: { customName: { contains: query, mode: 'insensitive' } } } },
      { place: { name: { contains: query, mode: 'insensitive' } } },
      {
        place: {
          mapEntry: {
            space: { name: { contains: query, mode: 'insensitive' } },
          },
        },
      },
      {
        place: {
          mapEntry: {
            owners: {
              some: {
                profile: { name: { contains: query, mode: 'insensitive' } },
              },
            },
          },
        },
      },
    ],
  };
}

function toGlobalOffer(record: OfferRecord): GlobalOffer[] {
  const offer = toTradeOffer(record);
  if (!offer) return [];
  const entry = record.place.mapEntry;
  const owners = prioritizePrimaryManagerOwner(
    entry.owners.map(({ profile }) => profile),
    entry.primaryManager.minecraftProfile?.uuid,
  );
  return [{
    offer,
    place: {
      id: record.place.slug,
      name: record.place.name,
      owners,
      space: entry.space,
    },
  }];
}
