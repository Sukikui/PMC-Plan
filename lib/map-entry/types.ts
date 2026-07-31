import type { Role } from '@prisma/client';

export interface MinecraftOwner {
  uuid: string;
  name: string;
}

export interface MapEntryIdentity {
  id: string;
  name: string | null;
  username: string | null;
  image: string | null;
}

export interface MapEntryEditor extends MapEntryIdentity {
  editedAt: Date | string;
}

export interface MapEntryAccess {
  mapEntryId: string;
  primaryManagerId: string;
  managerIds: string[];
}

export interface MapEntryUser {
  id: string;
  name: string | null;
  username: string | null;
  image: string | null;
  role: Role;
  minecraftProfile: MinecraftOwner | null;
}

export interface MapEntryManagement {
  access: MapEntryAccess;
  lastEditor: MapEntryEditor;
  primaryManager: MapEntryUser;
  managers: MapEntryUser[];
  owners: MinecraftOwner[];
}

export interface MapEntryCreationInput {
  managerIds: string[];
  owners: MinecraftOwner[];
  excludedOwnerUuids: string[];
  spaceId?: string | null;
}

export interface MapEntryUpdateInput extends MapEntryCreationInput {
  primaryManagerId: string;
  transferConfirmation?: string;
}

export interface MapEntryDraft {
  managers: MapEntryUser[];
  owners: MinecraftOwner[];
  excludedOwnerUuids: string[];
  primaryManager: MapEntryUser | null;
  transferConfirmation: string | null;
}

export interface MapEntryCreationPayload {
  managerIds: string[];
  ownerNames: string[];
  excludedOwnerUuids: string[];
}

export interface MapEntryUpdatePayload {
  managerIds: string[];
  owners: MinecraftOwner[];
  excludedOwnerUuids: string[];
  primaryManagerId: string;
  transferConfirmation?: string;
}

export const emptyMapEntryDraft = (): MapEntryDraft => ({
  managers: [],
  owners: [],
  excludedOwnerUuids: [],
  primaryManager: null,
  transferConfirmation: null,
});

export const toMapEntryCreationPayload = (
  draft: MapEntryDraft,
): MapEntryCreationPayload => ({
  managerIds: draft.managers.map(({ id }) => id),
  ownerNames: draft.owners.map(({ name }) => name),
  excludedOwnerUuids: draft.excludedOwnerUuids,
});

export const toMapEntryUpdatePayload = (
  draft: MapEntryDraft,
): MapEntryUpdatePayload => {
  if (!draft.primaryManager) {
    throw new Error('Le gestionnaire principal est introuvable.');
  }

  return {
    managerIds: draft.managers.map(({ id }) => id),
    owners: draft.owners,
    excludedOwnerUuids: draft.excludedOwnerUuids,
    primaryManagerId: draft.primaryManager.id,
    ...(draft.transferConfirmation
      ? { transferConfirmation: draft.transferConfirmation }
      : {}),
  };
};

export const toMapEntryDraft = (
  management: MapEntryManagement,
): MapEntryDraft => {
  const ownerUuids = new Set(management.owners.map(({ uuid }) => uuid));
  const excludedOwnerUuids = [
    management.primaryManager,
    ...management.managers,
  ].flatMap(({ minecraftProfile }) => (
    minecraftProfile && !ownerUuids.has(minecraftProfile.uuid)
      ? [minecraftProfile.uuid]
      : []
  ));

  return {
    managers: management.managers,
    owners: management.owners,
    excludedOwnerUuids,
    primaryManager: management.primaryManager,
    transferConfirmation: null,
  };
};

export const getMapEntryDraftSnapshot = (draft: MapEntryDraft) => ({
  managerIds: draft.managers.map(({ id }) => id),
  ownerUuids: draft.owners.map(({ uuid }) => uuid),
  excludedOwnerUuids: draft.excludedOwnerUuids,
  primaryManagerId: draft.primaryManager?.id ?? null,
});

export function uniqueMinecraftOwners(owners: MinecraftOwner[]) {
  return Array.from(
    new Map(owners.map((owner) => [owner.uuid, owner])).values(),
  );
}
