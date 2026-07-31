import type { Prisma } from '@prisma/client';
import type { MinecraftOwner } from './types';

export function prioritizePrimaryManagerOwner(
  owners: MinecraftOwner[],
  primaryProfileUuid?: string | null,
) {
  const primaryOwnerIndex = primaryProfileUuid
    ? owners.findIndex(({ uuid }) => uuid === primaryProfileUuid)
    : -1;
  if (primaryOwnerIndex <= 0) return owners;
  return [
    owners[primaryOwnerIndex],
    ...owners.slice(0, primaryOwnerIndex),
    ...owners.slice(primaryOwnerIndex + 1),
  ];
}

export async function addLinkedMinecraftOwner(
  tx: Prisma.TransactionClient,
  mapEntryId: string,
  profileUuid?: string,
) {
  if (!profileUuid) return;
  const existing = await tx.mapEntryOwner.findUnique({
    where: { mapEntryId_profileUuid: { mapEntryId, profileUuid } },
    select: { profileUuid: true },
  });
  if (existing) return;

  const lastOwner = await tx.mapEntryOwner.findFirst({
    where: { mapEntryId },
    orderBy: { position: 'desc' },
    select: { position: true },
  });
  await tx.mapEntryOwner.create({
    data: {
      mapEntryId,
      profileUuid,
      position: (lastOwner?.position ?? -1) + 1,
    },
  });
}
