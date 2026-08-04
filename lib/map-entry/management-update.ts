import type { Prisma } from '@prisma/client';
import {
  canAdministerContent,
  canContribute,
  canManageContent,
} from '@/lib/content-permissions';
import { upsertMinecraftProfile } from '@/lib/minecraft/profiles';
import { MapEntryError, type MapEntryActor } from './service';
import type { MapEntryUpdateInput } from './types';
import { uniqueMinecraftOwners } from './types';

export async function updateMapEntryManagement(
  tx: Prisma.TransactionClient,
  mapEntryId: string,
  actor: MapEntryActor,
  input: MapEntryUpdateInput,
) {
  const entry = await tx.mapEntry.findUnique({
    where: { id: mapEntryId },
    select: {
      primaryManagerId: true,
      managers: { select: { userId: true } },
    },
  });
  if (!entry) {
    throw new MapEntryError('Ressource introuvable.', 404);
  }

  const currentManagerIds = entry.managers.map(({ userId }) => userId);
  if (!canManageContent(actor.role, actor.userId, {
    primaryManagerId: entry.primaryManagerId,
    managerIds: currentManagerIds,
  })) {
    throw new MapEntryError('Accès refusé.', 403);
  }

  const primaryManagerId = input.primaryManagerId;
  const managerIds = Array.from(new Set(input.managerIds))
    .filter((userId) => userId !== primaryManagerId);
  const teamChanged = primaryManagerId !== entry.primaryManagerId
    || !haveSameIds(managerIds, currentManagerIds);
  if (
    teamChanged
    && !canAdministerContent(actor.role, actor.userId, entry.primaryManagerId)
  ) {
    throw new MapEntryError(
      'Seul le gestionnaire principal peut modifier l’équipe.',
      403,
    );
  }

  const users = await tx.user.findMany({
    where: { id: { in: [primaryManagerId, ...managerIds] } },
    select: {
      id: true,
      role: true,
      discordUsername: true,
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
    throw new MapEntryError(
      'Un gestionnaire sélectionné ne peut pas gérer de contenu.',
      400,
    );
  }

  if (primaryManagerId !== entry.primaryManagerId) {
    if (
      input.transferConfirmation !== `@${primaryManager.discordUsername}`
    ) {
      throw new MapEntryError(
        'La confirmation ne correspond pas à l’identifiant Discord.',
        400,
      );
    }
  }

  for (const owner of input.owners) {
    await upsertMinecraftProfile(tx, owner);
  }
  const excludedOwnerUuids = new Set(input.excludedOwnerUuids);
  const automaticOwners = users
    .flatMap(({ minecraftProfile }) => minecraftProfile ? [minecraftProfile] : [])
    .filter(({ uuid }) => !excludedOwnerUuids.has(uuid));
  const owners = uniqueMinecraftOwners([...automaticOwners, ...input.owners]);

  if (teamChanged) {
    await tx.mapEntryManager.deleteMany({ where: { mapEntryId } });
    if (managerIds.length) {
      await tx.mapEntryManager.createMany({
        data: managerIds.map((userId) => ({ mapEntryId, userId })),
      });
    }
  }
  await tx.mapEntryOwner.deleteMany({ where: { mapEntryId } });
  if (owners.length) {
    await tx.mapEntryOwner.createMany({
      data: owners.map(({ uuid }, position) => ({
        mapEntryId,
        profileUuid: uuid,
        position,
      })),
    });
  }
  await tx.mapEntry.update({
    where: { id: mapEntryId },
    data: {
      ...(teamChanged ? { primaryManagerId } : {}),
      lastEditorId: actor.userId,
    },
  });
}

function haveSameIds(left: string[], right: string[]) {
  if (left.length !== right.length) return false;
  const rightIds = new Set(right);
  return left.every((id) => rightIds.has(id));
}
