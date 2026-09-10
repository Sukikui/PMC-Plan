import type { Prisma } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';
import type { PaginatedResponse } from '@/lib/api/pagination';
import { toPaginationMeta } from '@/lib/api/pagination';
import { contentCacheTags } from '@/lib/content/cache-tags';
import {
  DEFAULT_SPACE_SUMMARY_SORT,
  type SpaceReference,
  type SpaceSummary,
  type SpaceSummarySort,
} from './types';
import { isAdministrationRole } from '@/lib/admin/roles';
import { validTradeOfferWhere } from '@/lib/trade/query';
import { cacheDatabaseQuery } from '@/lib/cache/database-cache';

const summarySelect = {
  id: true,
  slug: true,
  name: true,
  description: true,
  color: true,
  logoUrl: true,
  logoBackground: true,
  logoZoom: true,
  discordUrl: true,
  entries: {
    orderBy: { createdAt: 'asc' as const },
    select: {
      images: true,
      place: {
        select: {
          _count: {
            select: { tradeOffers: { where: validTradeOfferWhere } },
          },
        },
      },
      portals: { take: 1, select: { uid: true } },
      owners: {
        orderBy: { position: 'asc' as const },
        select: {
          profile: { select: { uuid: true, name: true } },
        },
      },
    },
  },
} satisfies Prisma.SpaceSelect;

type SummaryRecord = Prisma.SpaceGetPayload<{ select: typeof summarySelect }>;

export async function listSpaceSummaries({
  page,
  pageSize,
  query,
  sort,
}: {
  page: number;
  pageSize: number;
  query: string;
  sort: SpaceSummarySort;
}): Promise<PaginatedResponse<SpaceSummary>> {
  const where = getSummaryWhere(query);
  const [records, total] = await prisma.$transaction([
    prisma.space.findMany({
      where,
      select: summarySelect,
      orderBy: getSummaryOrderBy(sort),
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.space.count({ where }),
  ]);

  return {
    items: records.map(toSpaceSummary),
    pagination: toPaginationMeta(page, pageSize, total),
  };
}

const loadCachedSummaries = cacheDatabaseQuery(
  (
    page: number,
    pageSize: number,
    query: string,
    sort: SpaceSummarySort,
  ) => listSpaceSummaries({
    page,
    pageSize,
    query,
    sort,
  }),
  ['space-summaries-v3'],
  { revalidate: 300, tags: [contentCacheTags.spaces] },
);

export const loadSpaceSummaries = (
  page: number,
  pageSize: number,
  query: string,
  sort: SpaceSummarySort,
) => loadCachedSummaries(page, pageSize, query, sort);

export function parseSpaceSummarySort(value: string | null): SpaceSummarySort {
  if (
    value === 'name-desc'
    || value === 'content-asc'
    || value === 'content-desc'
  ) {
    return value;
  }
  return DEFAULT_SPACE_SUMMARY_SORT;
}

export async function listManageableSpaceReferences(
  userId: string,
  role?: string,
): Promise<SpaceReference[]> {
  return prisma.space.findMany({
    where: isAdministrationRole(role) ? {} : {
      OR: [
        { primaryManagerId: userId },
        { managers: { some: { userId } } },
      ],
    },
    orderBy: [{ name: 'asc' }, { id: 'asc' }],
    select: {
      id: true,
      slug: true,
      name: true,
      color: true,
      logoUrl: true,
      logoBackground: true,
      logoZoom: true,
      discordUrl: true,
    },
  });
}

function getSummaryWhere(query: string): Prisma.SpaceWhereInput {
  if (!query) return {};
  return {
    OR: [
      { name: { contains: query, mode: 'insensitive' } },
      { description: { contains: query, mode: 'insensitive' } },
      {
        entries: {
          some: {
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

function getSummaryOrderBy(
  sort: SpaceSummarySort,
): Prisma.SpaceOrderByWithRelationInput[] {
  const orderBy: Prisma.SpaceOrderByWithRelationInput[] = [];
  if (sort === 'content-asc') {
    orderBy.push({ entries: { _count: 'asc' } });
  } else if (sort === 'content-desc') {
    orderBy.push({ entries: { _count: 'desc' } });
  }
  const nameDirection = sort === 'name-desc' ? 'desc' : 'asc';
  orderBy.push({ name: nameDirection }, { id: 'asc' });
  return orderBy;
}

function toSpaceSummary(record: SummaryRecord): SpaceSummary {
  const members = Array.from(new Map(record.entries.flatMap(({ owners }) => (
    owners.map(({ profile }) => [profile.uuid, profile] as const)
  ))).values());
  return {
    id: record.id,
    slug: record.slug,
    name: record.name,
    description: record.description,
    color: record.color,
    logoUrl: record.logoUrl,
    logoBackground: record.logoBackground,
    logoZoom: record.logoZoom,
    discordUrl: record.discordUrl,
    firstMember: members[0] ?? null,
    memberCount: members.length,
    offerCount: record.entries.reduce(
      (sum, { place }) => sum + (place?._count.tradeOffers ?? 0),
      0,
    ),
    placeCount: record.entries.filter(({ place }) => place).length,
    portalCount: record.entries.filter(({ portals }) => portals.length).length,
    previewImage: record.entries.find(({ images, place }) => (
      place && images[0]
    ))?.images[0] ?? null,
  };
}
