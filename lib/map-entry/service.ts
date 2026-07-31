import { Prisma } from '@prisma/client';
import { canContribute } from '@/lib/content-permissions';
import { prisma } from '@/lib/prisma';
import { upsertMinecraftProfile } from '@/lib/minecraft/profiles';
import {
  managementMapEntryInclude,
  toMapEntryManagement,
} from './serialization';
import type {
  MapEntryCreationInput,
} from './types';
import { uniqueMinecraftOwners } from './types';

export async function createMapEntry(
  tx: Prisma.TransactionClient,
  primaryManagerId: string,
  input: MapEntryCreationInput = {
    managerIds: [],
    owners: [],
    excludedOwnerUuids: [],
    spaceId: null,
  },
) {
  const managerIds = Array.from(new Set(input.managerIds))
    .filter((userId) => userId !== primaryManagerId);
  const users = await tx.user.findMany({
    where: { id: { in: [primaryManagerId, ...managerIds] } },
    select: {
      id: true,
      role: true,
      minecraftProfile: { select: { uuid: true, name: true } },
    },
  });
  const primaryManager = users.find(({ id }) => id === primaryManagerId);
  const managers = users.filter(({ id }) => managerIds.includes(id));
  if (
    !primaryManager
    || !canContribute(primaryManager.role)
    || managers.length !== managerIds.length
    || managers.some(({ role }) => !canContribute(role))
  ) {
    throw new MapEntryError('Un gestionnaire sélectionné ne peut pas gérer de contenu.', 400);
  }

  for (const owner of input.owners) {
    await upsertMinecraftProfile(tx, owner);
  }
  const excludedOwnerUuids = new Set(input.excludedOwnerUuids);
  const automaticOwners = [
    ...(primaryManager.minecraftProfile ? [primaryManager.minecraftProfile] : []),
    ...managers.flatMap(({ minecraftProfile }) => (
      minecraftProfile ? [minecraftProfile] : []
    )),
  ].filter(({ uuid }) => !excludedOwnerUuids.has(uuid));
  const owners = uniqueMinecraftOwners([
    ...automaticOwners,
    ...input.owners,
  ]);

  return tx.mapEntry.create({
    data: {
      spaceId: input.spaceId ?? null,
      primaryManagerId,
      lastEditorId: primaryManagerId,
      managers: managerIds.length
        ? {
            create: managerIds.map((userId) => ({ userId })),
          }
        : undefined,
      owners: owners.length
        ? {
            create: owners.map(({ uuid }, position) => ({
              profileUuid: uuid,
              position,
            })),
          }
        : undefined,
    },
  });
}

export async function getMapEntryManagement(mapEntryId: string) {
  const entry = await prisma.mapEntry.findUnique({
    where: { id: mapEntryId },
    include: managementMapEntryInclude,
  });

  return entry ? toMapEntryManagement(entry) : null;
}

export interface MapEntryActor {
  userId: string;
  role?: string;
}

export class MapEntryError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}
