import type { Prisma, Role } from '@prisma/client';
import { canContribute } from '@/lib/content-permissions';
import { addLinkedMinecraftOwner } from '@/lib/map-entry/owners';
import {
  managementMapEntryInclude,
  toMapEntryManagement,
} from '@/lib/map-entry/serialization';
import type { MapEntryManagement } from '@/lib/map-entry/types';
import { runSerializableTransaction } from '@/lib/prisma/transaction';
import {
  PRIMARY_MANAGEMENT_TRANSFER_REQUIRED,
  type AdminManagedContentCounts,
} from './users';

interface DeleteUserAccountInput {
  actorUserId: string;
  expectedRole: Role;
  targetUserId: string;
  transferToUserId?: string;
}

interface DeleteUserAccountResult {
  affectedServiceSlugs: string[];
  affectedSpaceSlugs: string[];
  managementUpdates: MapEntryManagement[];
  transferredEntryCount: number;
  transferredSpaceCount: number;
}

export class AdminUserDeletionError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: typeof PRIMARY_MANAGEMENT_TRANSFER_REQUIRED,
    readonly primaryManagedContent?: AdminManagedContentCounts,
  ) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export function deleteUserAccount(
  input: DeleteUserAccountInput,
): Promise<DeleteUserAccountResult> {
  return runSerializableTransaction(async (tx) => {
    const affectedEntries = await tx.mapEntry.findMany({
      where: {
        OR: [
          { primaryManagerId: input.targetUserId },
          { lastEditorId: input.targetUserId },
          { managers: { some: { userId: input.targetUserId } } },
        ],
      },
      select: {
        id: true,
        primaryManagerId: true,
        place: { select: { uid: true } },
        portals: {
          select: { uid: true },
          take: 1,
        },
        service: { select: { slug: true, uid: true } },
      },
    });
    const primaryEntries = affectedEntries.filter(
      ({ primaryManagerId }) => primaryManagerId === input.targetUserId,
    );
    const affectedSpaces = await tx.space.findMany({
      where: {
        OR: [
          { primaryManagerId: input.targetUserId },
          { lastEditorId: input.targetUserId },
          { managers: { some: { userId: input.targetUserId } } },
        ],
      },
      select: {
        id: true,
        slug: true,
        primaryManagerId: true,
      },
    });
    const primarySpaces = affectedSpaces.filter(
      ({ primaryManagerId }) => primaryManagerId === input.targetUserId,
    );

    if (
      (primaryEntries.length > 0 || primarySpaces.length > 0)
      && !input.transferToUserId
    ) {
      throw new AdminUserDeletionError(
        'Un nouveau gestionnaire principal doit être sélectionné.',
        409,
        PRIMARY_MANAGEMENT_TRANSFER_REQUIRED,
        countManagedContent(primaryEntries, primarySpaces.length),
      );
    }

    if (primaryEntries.length > 0 || primarySpaces.length > 0) {
      const nextPrimary = await requireTransferTarget(tx, input);
      await transferPrimaryEntries(
        tx,
        primaryEntries.map(({ id }) => id),
        input,
        nextPrimary,
      );
      await transferPrimarySpaces(
        tx,
        primarySpaces.map(({ id }) => id),
        input,
      );
    }

    const deletion = await tx.user.deleteMany({
      where: {
        id: input.targetUserId,
        role: input.expectedRole,
      },
    });
    if (deletion.count === 0) {
      throw new AdminUserDeletionError(
        'Le compte a été modifié. Recharge la liste avant de réessayer.',
        409,
      );
    }

    const updatedEntries = affectedEntries.length > 0
      ? await tx.mapEntry.findMany({
          where: { id: { in: affectedEntries.map(({ id }) => id) } },
          include: managementMapEntryInclude,
        })
      : [];

    return {
      affectedServiceSlugs: affectedEntries.flatMap(({ service }) => (
        service ? [service.slug] : []
      )),
      affectedSpaceSlugs: affectedSpaces.map(({ slug }) => slug),
      managementUpdates: updatedEntries.map(toMapEntryManagement),
      transferredEntryCount: primaryEntries.length,
      transferredSpaceCount: primarySpaces.length,
    };
  });
}

export function countManagedContent(
  entries: Array<{
    place: { uid: string } | null;
    portals: Array<{ uid: string }>;
    service: { uid: string } | null;
  }>,
  spaces = 0,
): AdminManagedContentCounts {
  const counts = entries.reduce(
    (counts, entry) => {
      if (entry.place) counts.places += 1;
      else if (entry.portals.length > 0) counts.portals += 1;
      else if (entry.service) counts.services += 1;
      return counts;
    },
    { places: 0, portals: 0, services: 0, spaces },
  );
  return counts;
}

async function transferPrimaryEntries(
  tx: Prisma.TransactionClient,
  mapEntryIds: string[],
  input: DeleteUserAccountInput,
  nextPrimary: {
    minecraftProfile: { uuid: string } | null;
  },
) {
  const nextPrimaryId = input.transferToUserId!;

  for (const mapEntryId of mapEntryIds) {
    await tx.mapEntryManager.deleteMany({
      where: { mapEntryId, userId: nextPrimaryId },
    });
    await tx.mapEntry.update({
      where: { id: mapEntryId },
      data: {
        primaryManagerId: nextPrimaryId,
        lastEditorId: input.actorUserId,
      },
    });
    await addLinkedMinecraftOwner(
      tx,
      mapEntryId,
      nextPrimary.minecraftProfile?.uuid,
    );
  }
}

async function transferPrimarySpaces(
  tx: Prisma.TransactionClient,
  spaceIds: string[],
  input: DeleteUserAccountInput,
) {
  const nextPrimaryId = input.transferToUserId!;
  for (const spaceId of spaceIds) {
    await tx.spaceManager.deleteMany({
      where: { spaceId, userId: nextPrimaryId },
    });
    await tx.space.update({
      where: { id: spaceId },
      data: {
        primaryManagerId: nextPrimaryId,
        lastEditorId: input.actorUserId,
      },
    });
  }
}

async function requireTransferTarget(
  tx: Prisma.TransactionClient,
  input: DeleteUserAccountInput,
) {
  const nextPrimaryId = input.transferToUserId!;
  if (nextPrimaryId === input.targetUserId) {
    throw new AdminUserDeletionError(
      'Sélectionne un autre compte Discord.',
      400,
    );
  }

  const nextPrimary = await tx.user.findUnique({
    where: { id: nextPrimaryId },
    select: {
      role: true,
      minecraftProfile: { select: { uuid: true } },
    },
  });
  if (!nextPrimary || !canContribute(nextPrimary.role)) {
    throw new AdminUserDeletionError(
      'Ce compte ne peut pas devenir gestionnaire principal.',
      400,
    );
  }
  return nextPrimary;
}
