import type { Prisma, ServiceContactType } from '@prisma/client';
import { unstable_cache } from 'next/cache';
import type { PaginatedResponse } from '@/lib/api/pagination';
import { toPaginationMeta } from '@/lib/api/pagination';
import { contentCacheTags } from '@/lib/content/cache-tags';
import { discordIdentitySelect, toPublicDiscordIdentity } from '@/lib/discord-user';
import { prioritizePrimaryManagerOwner } from '@/lib/map-entry/owners';
import { prisma } from '@/lib/prisma';
import type { ServiceListItem } from './types';

const listInclude = {
  mapEntry: {
    select: {
      primaryManager: {
        select: {
          ...discordIdentitySelect,
          minecraftProfile: { select: { uuid: true } },
        },
      },
      owners: {
        orderBy: { position: 'asc' as const },
        select: {
          profile: { select: { uuid: true, name: true } },
        },
      },
    },
  },
} satisfies Prisma.ServiceInclude;

type ListRecord = Prisma.ServiceGetPayload<{ include: typeof listInclude }>;

export async function listServices({
  contactType,
  page,
  pageSize,
  query,
}: {
  contactType: ServiceContactType | null;
  page: number;
  pageSize: number;
  query: string;
}): Promise<PaginatedResponse<ServiceListItem>> {
  const where = getServiceWhere(query, contactType);
  const [records, total] = await prisma.$transaction([
    prisma.service.findMany({
      where,
      include: listInclude,
      orderBy: [{ name: 'asc' }, { uid: 'asc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.service.count({ where }),
  ]);
  return {
    items: records.map(toServiceListItem),
    pagination: toPaginationMeta(page, pageSize, total),
  };
}

const loadCachedServices = unstable_cache(
  (
    contactType: ServiceContactType | null,
    page: number,
    pageSize: number,
    query: string,
  ) => listServices({ contactType, page, pageSize, query }),
  ['service-list-v1'],
  { revalidate: 300, tags: [contentCacheTags.services] },
);

export const loadServiceList = (
  contactType: ServiceContactType | null,
  page: number,
  pageSize: number,
  query: string,
) => loadCachedServices(contactType, page, pageSize, query);

function getServiceWhere(
  query: string,
  contactType: ServiceContactType | null,
): Prisma.ServiceWhereInput {
  return {
    ...(contactType ? { contactType } : {}),
    ...(query ? {
      OR: [
        { name: { contains: query, mode: 'insensitive' as const } },
        { subtitle: { contains: query, mode: 'insensitive' as const } },
        { description: { contains: query, mode: 'insensitive' as const } },
        { paymentDescription: { contains: query, mode: 'insensitive' as const } },
        {
          mapEntry: {
            owners: {
              some: {
                profile: { name: { contains: query, mode: 'insensitive' as const } },
              },
            },
          },
        },
      ],
    } : {}),
  };
}

function toServiceListItem(record: ListRecord): ServiceListItem {
  const entry = record.mapEntry;
  return {
    id: record.slug,
    slug: record.slug,
    name: record.name,
    subtitle: record.subtitle,
    description: record.description,
    contactType: record.contactType,
    contactDiscordUrl: record.contactDiscordUrl,
    illustrationItemId: record.illustrationItemId,
    paymentItemId: record.paymentItemId,
    paymentDescription: record.paymentDescription,
    owners: prioritizePrimaryManagerOwner(
      entry.owners.map(({ profile }) => profile),
      entry.primaryManager.minecraftProfile?.uuid,
    ),
    primaryManager: toPublicDiscordIdentity(entry.primaryManager),
  };
}
