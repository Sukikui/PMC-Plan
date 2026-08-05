import type { Prisma } from '@prisma/client';
import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/prisma';
import type { PaginatedResponse } from '@/lib/api/pagination';
import { toPaginationMeta } from '@/lib/api/pagination';
import { contentCacheTags } from '@/lib/content/cache-tags';
import type { SpaceReference, SpaceSummary } from './types';
import { isAdministrationRole } from '@/lib/admin/roles';
import { validTradeOfferWhere } from '@/lib/trade/query';

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
      place: {
        select: {
          images: true,
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
}: {
  page: number;
  pageSize: number;
  query: string;
}): Promise<PaginatedResponse<SpaceSummary>> {
  const where = getSummaryWhere(query);
  const [records, total] = await prisma.$transaction([
    prisma.space.findMany({
      where,
      select: summarySelect,
      orderBy: [{ name: 'asc' }, { id: 'asc' }],
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

const loadCachedSummaries = unstable_cache(
  (page: number, pageSize: number, query: string) => listSpaceSummaries({
    page,
    pageSize,
    query,
  }),
  ['space-summaries-v1'],
  { revalidate: 300, tags: [contentCacheTags.spaces] },
);

export const loadSpaceSummaries = (
  page: number,
  pageSize: number,
  query: string,
) => loadCachedSummaries(page, pageSize, query);

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
    previewImage: record.entries.find(({ place }) => place?.images[0])
      ?.place?.images[0] ?? null,
  };
}
