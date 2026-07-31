import type { Prisma } from '@prisma/client';
import { canManageContent } from '@/lib/content-permissions';
import { MapEntryError, type MapEntryActor } from './service';

export async function validateSpaceAssociation(
  tx: Prisma.TransactionClient,
  actor: MapEntryActor,
  spaceId: string | null | undefined,
) {
  if (!spaceId) return;

  const space = await tx.space.findUnique({
    where: { id: spaceId },
    select: {
      primaryManagerId: true,
      managers: { select: { userId: true } },
    },
  });
  if (!space) {
    throw new MapEntryError('L’espace sélectionné est introuvable.', 400);
  }
  if (!canManageContent(actor.role, actor.userId, {
    primaryManagerId: space.primaryManagerId,
    managerIds: space.managers.map(({ userId }) => userId),
  })) {
    throw new MapEntryError(
      'Tu ne peux pas rattacher du contenu à cet espace.',
      403,
    );
  }
}

export async function setMapEntrySpace(
  tx: Prisma.TransactionClient,
  mapEntryId: string,
  actor: MapEntryActor,
  spaceId: string | null | undefined,
) {
  const entry = await tx.mapEntry.findUnique({
    where: { id: mapEntryId },
    select: { spaceId: true },
  });
  if (!entry) {
    throw new MapEntryError('Ressource introuvable.', 404);
  }

  if (spaceId !== undefined && spaceId !== entry.spaceId) {
    await validateSpaceAssociation(tx, actor, spaceId);
  }

  await tx.mapEntry.update({
    where: { id: mapEntryId },
    data: {
      ...(spaceId !== undefined ? { spaceId } : {}),
      lastEditorId: actor.userId,
    },
  });
}
