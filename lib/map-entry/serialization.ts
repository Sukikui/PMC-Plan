import type {
  MapEntryAccess,
  MapEntryEditor,
  MapEntryIdentity,
  MapEntryManagement,
  MapEntryUser,
  MinecraftOwner,
} from './types';
import type { SpaceReference } from '@/lib/spaces/types';
import {
  discordIdentitySelect,
  type StoredDiscordIdentity,
  toPublicDiscordIdentity,
} from '@/lib/discord-user';
import { prioritizePrimaryManagerOwner } from './owners';

interface PublicPrimaryManagerRecord extends StoredDiscordIdentity {
  minecraftProfile: MinecraftOwner | null;
}

interface PublicMapEntryRecord {
  id: string;
  primaryManagerId: string;
  updatedAt: Date;
  primaryManager: PublicPrimaryManagerRecord;
  lastEditor: StoredDiscordIdentity | null;
  managers: Array<{ userId: string }>;
  owners: Array<{ profile: MinecraftOwner }>;
  space: SpaceReference | null;
}

interface ManagementUserRecord extends StoredDiscordIdentity {
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
      ...discordIdentitySelect,
      minecraftProfile: {
        select: { uuid: true, name: true },
      },
    },
  },
  lastEditor: {
    select: discordIdentitySelect,
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
      ...discordIdentitySelect,
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
          ...discordIdentitySelect,
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
    ...toPublicDiscordIdentity(editor),
    editedAt: entry.updatedAt,
  };
}

export function toMapEntryPrimaryManager(
  entry: PublicMapEntryRecord,
): MapEntryIdentity {
  return toPublicDiscordIdentity(entry.primaryManager);
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
    primaryManager: toManagementUser(entry.primaryManager),
    managers: entry.managers.map(({ user }) => toManagementUser(user)),
    owners: toMinecraftOwners(entry),
  };
}

function toManagementUser(user: ManagementUserRecord): MapEntryUser {
  return {
    ...toPublicDiscordIdentity(user),
    role: user.role,
    minecraftProfile: user.minecraftProfile,
  };
}
