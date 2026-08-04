import { Prisma, type World } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import {
  type ContentManagementFilter,
  type ContentManagementResponse,
  type ContentManagementSummary,
  type ContentManagementType,
} from './types';
import { MANAGEMENT_LIST_PAGE_SIZE } from '@/lib/management/pagination';
import {
  publicMapEntryInclude,
} from '@/lib/map-entry/serialization';
import { DEFAULT_PLACE_CATEGORY, isPlaceCategory } from '@/lib/place/categories';
import { getMapEntryWhere, getSpaceWhere } from './filters';

interface ListContentManagementOptions {
  filter: ContentManagementFilter;
  managerId?: string;
  page: number;
  query: string;
  type: ContentManagementType;
}

const mapEntryInclude = {
  primaryManager: publicMapEntryInclude.primaryManager,
  space: publicMapEntryInclude.space,
  place: {
    select: {
      category: true,
      name: true,
      slug: true,
      world: true,
    },
  },
  portals: {
    select: {
      name: true,
      slug: true,
      world: true,
    },
  },
  service: {
    select: {
      contactType: true,
      illustrationItemId: true,
      name: true,
      slug: true,
    },
  },
  _count: { select: { managers: true } },
} satisfies Prisma.MapEntryInclude;

type ContentManagementMapEntry = Prisma.MapEntryGetPayload<{
  include: typeof mapEntryInclude;
}>;

export async function listContentManagement({
  filter,
  managerId,
  page,
  query,
  type,
}: ListContentManagementOptions): Promise<ContentManagementResponse> {
  if (type === 'space') return listSpaces(page, query, managerId);

  const where = getMapEntryWhere(type, query, filter, managerId);
  const [records, total] = await prisma.$transaction([
    prisma.mapEntry.findMany({
      where,
      include: mapEntryInclude,
      orderBy: { updatedAt: 'desc' },
      skip: (page - 1) * MANAGEMENT_LIST_PAGE_SIZE,
      take: MANAGEMENT_LIST_PAGE_SIZE,
    }),
    prisma.mapEntry.count({ where }),
  ]);

  return toResponse(
    page,
    total,
    records.flatMap((record) => toMapEntrySummary(record, type)),
  );
}

function toMapEntrySummary(
  record: ContentManagementMapEntry,
  type: Exclude<ContentManagementType, 'space'>,
): ContentManagementSummary[] {
  const common = {
    id: record.id,
    managerCount: record._count.managers,
    primaryManager: record.primaryManager,
  };
  if (type === 'place' && record.place) {
    return [{
      ...common,
      type,
      category: isPlaceCategory(record.place.category)
        ? record.place.category
        : DEFAULT_PLACE_CATEGORY,
      mapEntryId: record.id,
      name: record.place.name,
      slug: record.place.slug,
      space: record.space,
      world: record.place.world,
    }];
  }
  if (type === 'service' && record.service) {
    return [{
      ...common,
      type,
      contactType: record.service.contactType,
      illustrationItemId: record.service.illustrationItemId,
      mapEntryId: record.id,
      name: record.service.name,
      slug: record.service.slug,
    }];
  }
  if (type !== 'portal' || record.portals.length === 0) return [];

  const canonical = record.portals.find(({ world }) => world === 'overworld')
    ?? record.portals[0];
  return [{
    ...common,
    type,
    linked: hasWorld(record.portals, 'overworld')
      && hasWorld(record.portals, 'nether'),
    mapEntryId: record.id,
    name: canonical.name,
    slug: canonical.slug,
    space: record.space,
    world: canonical.world,
  }];
}

function hasWorld(portals: Array<{ world: World }>, world: World) {
  return portals.some((portal) => portal.world === world);
}

async function listSpaces(
  page: number,
  query: string,
  managerId?: string,
): Promise<ContentManagementResponse> {
  const where = getSpaceWhere(query, managerId);
  const [records, total] = await prisma.$transaction([
    prisma.space.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      skip: (page - 1) * MANAGEMENT_LIST_PAGE_SIZE,
      take: MANAGEMENT_LIST_PAGE_SIZE,
      include: {
        primaryManager: { select: publicMapEntryInclude.primaryManager.select },
        entries: {
          select: {
            place: {
              select: {
                uid: true,
                _count: { select: { tradeOffers: true } },
              },
            },
            portals: { take: 1, select: { uid: true } },
          },
        },
        _count: { select: { managers: true } },
      },
    }),
    prisma.space.count({ where }),
  ]);

  return toResponse(page, total, records.map((record) => ({
    id: record.id,
    type: 'space' as const,
    color: record.color,
    logoBackground: record.logoBackground,
    logoUrl: record.logoUrl,
    logoZoom: record.logoZoom,
    managerCount: record._count.managers,
    name: record.name,
    offerCount: record.entries.reduce(
      (total, { place }) => total + (place?._count.tradeOffers ?? 0),
      0,
    ),
    placeCount: record.entries.filter(({ place }) => place).length,
    portalCount: record.entries.filter(({ portals }) => portals.length > 0).length,
    primaryManager: record.primaryManager,
    slug: record.slug,
  })));
}

function toResponse(
  page: number,
  total: number,
  items: ContentManagementSummary[],
): ContentManagementResponse {
  return {
    items,
    pagination: {
      page,
      pageSize: MANAGEMENT_LIST_PAGE_SIZE,
      total,
      totalPages: Math.max(1, Math.ceil(total / MANAGEMENT_LIST_PAGE_SIZE)),
    },
  };
}
