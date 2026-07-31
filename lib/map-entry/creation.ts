import { prisma } from '@/lib/prisma';
import {
  MinecraftProfileError,
  resolveMinecraftProfiles,
} from '@/lib/minecraft/profiles';
import type {
  MapEntryCreationInput,
  MapEntryUpdateInput,
  MinecraftOwner,
} from './types';

interface MapEntryCreationPayload {
  managerIds?: string[];
  ownerNames?: string[];
  excludedOwnerUuids?: string[];
}

interface MapEntryUpdatePayload {
  managerIds?: string[];
  owners?: MinecraftOwner[];
  excludedOwnerUuids?: string[];
  primaryManagerId: string;
  transferConfirmation?: string;
}

export async function prepareMapEntryCreation(
  payload?: MapEntryCreationPayload,
  spaceId?: string | null,
): Promise<MapEntryCreationInput> {
  const managerIds = Array.from(new Set(payload?.managerIds ?? []));
  const ownerNames = Array.from(new Set(payload?.ownerNames ?? []));
  const owners = ownerNames.length
    ? await resolveMinecraftProfiles(ownerNames)
    : [];

  return {
    managerIds,
    owners,
    excludedOwnerUuids: Array.from(new Set(payload?.excludedOwnerUuids ?? [])),
    spaceId: spaceId ?? null,
  };
}

export async function prepareMapEntryUpdate(
  payload: MapEntryUpdatePayload,
): Promise<MapEntryUpdateInput> {
  const submittedOwners = payload.owners ?? [];
  const storedOwners = await prisma.minecraftProfile.findMany({
    where: { uuid: { in: submittedOwners.map(({ uuid }) => uuid) } },
    select: { uuid: true, name: true },
  });
  const storedByUuid = new Map(
    storedOwners.map((owner) => [owner.uuid, owner]),
  );
  const missingOwners = submittedOwners.filter(
    ({ uuid }) => !storedByUuid.has(uuid),
  );
  const resolvedOwners = missingOwners.length
    ? await resolveMinecraftProfiles(missingOwners.map(({ name }) => name))
    : [];
  const resolvedByUuid = new Map(
    resolvedOwners.map((owner) => [owner.uuid, owner]),
  );
  if (missingOwners.some(({ uuid }) => !resolvedByUuid.has(uuid))) {
    throw new MinecraftProfileError(
      'Un propriétaire Minecraft ne correspond pas au compte vérifié.',
      400,
    );
  }

  return {
    managerIds: Array.from(new Set(payload.managerIds ?? [])),
    owners: submittedOwners.map(({ uuid }) => (
      storedByUuid.get(uuid) ?? resolvedByUuid.get(uuid)!
    )),
    excludedOwnerUuids: Array.from(
      new Set(payload.excludedOwnerUuids ?? []),
    ),
    primaryManagerId: payload.primaryManagerId,
    transferConfirmation: payload.transferConfirmation,
  };
}
