import { Prisma } from '@prisma/client';
import { normalizeDiscordUserQuery } from '@/lib/discord/user-search';
import type {
  ContentManagementFilter,
  ContentManagementType,
} from './types';

export function getMapEntryWhere(
  type: Exclude<ContentManagementType, 'space'>,
  query: string,
  filter: ContentManagementFilter,
  managerId?: string,
): Prisma.MapEntryWhereInput {
  const typeFilter = getMapEntryTypeFilter(type, filter);
  const constraints: Prisma.MapEntryWhereInput[] = [typeFilter];

  if (managerId) constraints.push(getManagementFilter(managerId));
  if (!query) {
    return constraints.length === 1 ? typeFilter : { AND: constraints };
  }

  const text = searchText(query);
  const discordQuery = normalizeDiscordUserQuery(query);
  const discordText = searchText(discordQuery);
  const contextSearch: Prisma.MapEntryWhereInput[] = type === 'service'
    ? []
    : [{ space: { is: { name: text } } }];
  const discordManagerSearch: Prisma.MapEntryWhereInput[] = discordQuery
    ? [
        { primaryManager: { is: { discordUsername: discordText } } },
        { managers: { some: { user: { is: { discordUsername: discordText } } } } },
      ]
    : [];

  constraints.push({
    OR: [
      getContentSearch(type, text),
      ...contextSearch,
      { primaryManager: { is: { discordDisplayName: text } } },
      ...discordManagerSearch,
    ],
  });
  return { AND: constraints };
}

export function getSpaceWhere(
  query: string,
  managerId?: string,
): Prisma.SpaceWhereInput {
  const constraints: Prisma.SpaceWhereInput[] = [];
  if (query) {
    const text = searchText(query);
    const discordQuery = normalizeDiscordUserQuery(query);
    const discordText = searchText(discordQuery);
    const discordManagerSearch: Prisma.SpaceWhereInput[] = discordQuery
      ? [
          { primaryManager: { is: { discordUsername: discordText } } },
          { managers: { some: { user: { is: { discordUsername: discordText } } } } },
        ]
      : [];
    constraints.push({
      OR: [
        { name: text },
        { slug: text },
        { primaryManager: { is: { discordDisplayName: text } } },
        ...discordManagerSearch,
      ],
    });
  }
  if (managerId) constraints.push(getManagementFilter(managerId));
  return constraints.length > 0 ? { AND: constraints } : {};
}

function getContentSearch(
  type: Exclude<ContentManagementType, 'space'>,
  text: Prisma.StringFilter,
): Prisma.MapEntryWhereInput {
  const identity = { OR: [{ name: text }, { slug: text }] };
  if (type === 'place') return { place: { is: identity } };
  if (type === 'service') return { service: { is: identity } };

  return {
    OR: [
      { portals: { some: { ...identity, world: 'overworld' } } },
      {
        AND: [
          { portals: { none: { world: 'overworld' } } },
          { portals: { some: identity } },
        ],
      },
    ],
  };
}

function getMapEntryTypeFilter(
  type: Exclude<ContentManagementType, 'space'>,
  filter: ContentManagementFilter,
): Prisma.MapEntryWhereInput {
  if (type === 'place') {
    return {
      place: {
        is: filter === 'overworld' || filter === 'nether'
          ? { world: filter }
          : {},
      },
    };
  }
  if (type === 'service') {
    const contactType = isServiceContactFilter(filter) ? filter : undefined;
    return { service: { is: contactType ? { contactType } : {} } };
  }

  const world = filter === 'overworld' || filter === 'nether'
    ? filter
    : null;
  return {
    portals: filter === 'linked'
      ? {
          some: { world: 'overworld' },
          every: { world: { in: ['overworld', 'nether'] } },
        }
      : { some: world ? { world } : {} },
    ...(filter === 'linked' && {
      AND: [{ portals: { some: { world: 'nether' } } }],
    }),
  };
}

function getManagementFilter(userId: string) {
  return {
    OR: [
      { primaryManagerId: userId },
      { managers: { some: { userId } } },
    ],
  };
}

function isServiceContactFilter(
  filter: ContentManagementFilter,
): filter is 'none' | 'primary_manager' | 'custom' {
  return filter === 'none'
    || filter === 'primary_manager'
    || filter === 'custom';
}

function searchText(value: string): Prisma.StringFilter {
  return { contains: value, mode: Prisma.QueryMode.insensitive };
}
