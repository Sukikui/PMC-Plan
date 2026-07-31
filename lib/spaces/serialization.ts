import type { Prisma } from '@prisma/client';
import { sortByLocalizedName } from '@/lib/content/sorting';
import { prioritizePrimaryManagerOwner } from '@/lib/map-entry/owners';
import type { Space } from './types';

const spaceUserSelect = {
  id: true,
  name: true,
  username: true,
  image: true,
  role: true,
} satisfies Prisma.UserSelect;

const spaceEditorSelect = {
  id: true,
  name: true,
  username: true,
  image: true,
} satisfies Prisma.UserSelect;

export const spaceInclude = {
  primaryManager: { select: spaceUserSelect },
  lastEditor: { select: spaceEditorSelect },
  managers: {
    orderBy: { addedAt: 'asc' as const },
    select: {
      userId: true,
      user: { select: spaceUserSelect },
    },
  },
  entries: {
    orderBy: { createdAt: 'asc' as const },
    select: {
      id: true,
      primaryManager: {
        select: {
          minecraftProfile: {
            select: { uuid: true, name: true },
          },
        },
      },
      place: {
        select: {
          _count: {
            select: { tradeOffers: true },
          },
          uid: true,
          slug: true,
          name: true,
          images: true,
          world: true,
          category: true,
        },
      },
      portals: {
        select: {
          slug: true,
          name: true,
          world: true,
        },
      },
      owners: {
        orderBy: { position: 'asc' as const },
        select: {
          profile: {
            select: {
              uuid: true,
              name: true,
            },
          },
        },
      },
    },
  },
} satisfies Prisma.SpaceInclude;

type SpaceRecord = Prisma.SpaceGetPayload<{ include: typeof spaceInclude }>;

export function toSpace(record: SpaceRecord): Space {
  const lastEditor = record.lastEditor ?? record.primaryManager;
  const entries = record.entries.map((entry) => ({
    ...entry,
    orderedOwners: prioritizePrimaryManagerOwner(
      entry.owners.map(({ profile }) => profile),
      entry.primaryManager.minecraftProfile?.uuid,
    ),
  }));
  const places = entries.flatMap(({ id, orderedOwners, place }) => (
    place ? [{
      category: place.category,
      mapEntryId: id,
      name: place.name,
      owners: orderedOwners,
      slug: place.slug,
      world: place.world,
    }] : []
  ));
  const portals = entries.flatMap(({ id, orderedOwners, portals: entryPortals }) => {
    const overworld = entryPortals.find(({ world }) => world === 'overworld');
    const canonical = overworld ?? entryPortals[0];
    if (!canonical) return [];
    return [{
      linked: entryPortals.some(({ world }) => world === 'overworld')
        && entryPortals.some(({ world }) => world === 'nether'),
      mapEntryId: id,
      name: canonical.name,
      owners: orderedOwners,
      slug: canonical.slug,
      world: canonical.world,
    }];
  });

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
    offerCount: entries.reduce((
      total,
      { place },
    ) => total + (place?._count.tradeOffers ?? 0), 0),
    images: entries.flatMap(({ place }) => (
      place?.images.map((url, index) => ({
        id: `${place.uid}-${index}`,
        url,
        placeId: place.uid,
        placeSlug: place.slug,
        placeName: place.name,
      })) ?? []
    )),
    places: sortByLocalizedName(places),
    portals: sortByLocalizedName(portals),
    members: sortByLocalizedName(Array.from(new Map(
      entries.flatMap(({ owners }) => (
        owners.map(({ profile }) => [profile.uuid, profile] as const)
      )),
    ).values())),
    primaryManagerId: record.primaryManagerId,
    managerIds: record.managers.map(({ userId }) => userId),
    primaryManager: record.primaryManager,
    managers: record.managers.map(({ user }) => user),
    lastEditor: {
      id: lastEditor.id,
      name: lastEditor.name,
      username: lastEditor.username,
      image: lastEditor.image,
      editedAt: record.updatedAt.toISOString(),
    },
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}
