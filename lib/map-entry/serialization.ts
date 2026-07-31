import type {
  MapEntryAccess,
  MapEntryEditor,
  MapEntryIdentity,
  MapEntryManagement,
  MapEntryUser,
  MinecraftOwner,
} from './types';
import type { SpaceReference } from '@/lib/spaces/types';
import { prioritizePrimaryManagerOwner } from './owners';

type MapEntryEditorIdentity = Omit<MapEntryEditor, 'editedAt'>;

interface PublicPrimaryManagerRecord extends MapEntryEditorIdentity {
  minecraftProfile: MinecraftOwner | null;
}

interface PublicMapEntryRecord {
  id: string;
  primaryManagerId: string;
  updatedAt: Date;
  primaryManager: PublicPrimaryManagerRecord;
  lastEditor: MapEntryEditorIdentity | null;
  managers: Array<{ userId: string }>;
  owners: Array<{ profile: MinecraftOwner }>;
  space: SpaceReference | null;
}

interface ManagementUserRecord {
  id: string;
  name: string | null;
  username: string | null;
  image: string | null;
  role: MapEntryUser['role'];
  minecraftProfile: MinecraftOwner | null;
}

interface ManagementMapEntryRecord extends PublicMapEntryRecord {
  primaryManager: ManagementUserRecord;
  managers: Array<{
    userId: string;
    user: ManagementUserRecord;
  }>;
}

export const publicMapEntryInclude = {
  primaryManager: {
    select: {
      id: true,
      name: true,
      username: true,
      image: true,
      minecraftProfile: {
        select: { uuid: true, name: true },
      },
    },
  },
  lastEditor: {
    select: {
      id: true,
      name: true,
      username: true,
      image: true,
    },
  },
  managers: {
    select: { userId: true },
  },
  owners: {
    orderBy: { position: 'asc' as const },
    select: {
      profile: {
        select: { uuid: true, name: true },
      },
    },
  },
  space: {
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
  },
};

export const managementMapEntryInclude = {
  primaryManager: {
    select: {
      id: true,
      name: true,
      username: true,
      image: true,
      role: true,
      minecraftProfile: {
        select: { uuid: true, name: true },
      },
    },
  },
  lastEditor: publicMapEntryInclude.lastEditor,
  managers: {
    orderBy: { addedAt: 'asc' as const },
    select: {
      userId: true,
      user: {
        select: {
          id: true,
          name: true,
          username: true,
          image: true,
          role: true,
          minecraftProfile: {
            select: { uuid: true, name: true },
          },
        },
      },
    },
  },
  owners: publicMapEntryInclude.owners,
  space: publicMapEntryInclude.space,
};

export function toMapEntryAccess(entry: PublicMapEntryRecord): MapEntryAccess {
  return {
    mapEntryId: entry.id,
    primaryManagerId: entry.primaryManagerId,
    managerIds: entry.managers.map(({ userId }) => userId),
  };
}

export function toMinecraftOwners(entry: PublicMapEntryRecord): MinecraftOwner[] {
  const owners = entry.owners.map(({ profile }) => profile);
  return prioritizePrimaryManagerOwner(
    owners,
    entry.primaryManager.minecraftProfile?.uuid,
  );
}

export function toMapEntryEditor(entry: PublicMapEntryRecord): MapEntryEditor {
  const editor = entry.lastEditor ?? entry.primaryManager;
  return {
    id: editor.id,
    name: editor.name,
    username: editor.username,
    image: editor.image,
    editedAt: entry.updatedAt,
  };
}

export function toMapEntryPrimaryManager(
  entry: PublicMapEntryRecord,
): MapEntryIdentity {
  const { id, image, name, username } = entry.primaryManager;
  return { id, image, name, username };
}

export function toMapEntrySpace(
  entry: PublicMapEntryRecord,
): SpaceReference | null {
  return entry.space;
}

export function toMapEntryManagement(entry: ManagementMapEntryRecord): MapEntryManagement {
  return {
    access: toMapEntryAccess(entry),
    lastEditor: toMapEntryEditor(entry),
    primaryManager: entry.primaryManager,
    managers: entry.managers.map(({ user }) => user),
    owners: toMinecraftOwners(entry),
  };
}
