import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { mineVerifyConflict, mineVerifyNotFound } from './errors';
import {
  clearMineVerifyRequestsForUser,
  createMineVerifyRequest,
  getLatestMineVerifyRequestForUser,
  getMineVerifyRequest,
  getMineVerifyRequestStatus,
  getPendingMineVerifyRequests,
  updateMineVerifyRequest,
} from './store';
import type {
  MineVerifyCodeCreatedInput,
  MineVerifyExpiredInput,
  MineVerifyValidatedInput,
} from './schemas';
import type { MineVerifyPublicStatus } from './types';

export async function createMinecraftLinkRequest(userId: string): Promise<MineVerifyPublicStatus> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { minecraftUuid: true, minecraftName: true, minecraftLinkedAt: true },
  });

  if (user?.minecraftUuid && user.minecraftLinkedAt) {
    return linkedStatus(user.minecraftUuid, user.minecraftName, user.minecraftLinkedAt);
  }

  const request = createMineVerifyRequest(userId);
  return { status: 'pending', requestId: request.requestId };
}

export async function getMinecraftLinkStatus(userId: string): Promise<MineVerifyPublicStatus> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { minecraftUuid: true, minecraftName: true, minecraftLinkedAt: true },
  });

  if (user?.minecraftUuid && user.minecraftLinkedAt) {
    return linkedStatus(user.minecraftUuid, user.minecraftName, user.minecraftLinkedAt);
  }

  const request = getLatestMineVerifyRequestForUser(userId);

  if (!request) {
    return { status: 'not_started' };
  }

  const status = getMineVerifyRequestStatus(request);

  if (status === 'expired') {
    return { status: 'expired', requestId: request.requestId };
  }

  if (status === 'code_created' && request.code) {
    return {
      status: 'code_created',
      requestId: request.requestId,
      code: request.code,
      command: `/mineverify ${request.code}`,
      expiresAt: request.expiresAt?.toISOString(),
    };
  }

  return { status: 'pending', requestId: request.requestId };
}

export function listPendingMineVerifyRequests() {
  return getPendingMineVerifyRequests().map((request) => ({
    requestId: request.requestId,
  }));
}

export async function unlinkMinecraftAccount(userId: string): Promise<MineVerifyPublicStatus> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      minecraftUuid: null,
      minecraftName: null,
      minecraftLinkedAt: null,
    },
  });

  clearMineVerifyRequestsForUser(userId);
  return { status: 'not_started' };
}

export function markMineVerifyCodeCreated(input: MineVerifyCodeCreatedInput) {
  const request = getMineVerifyRequest(input.requestId);

  if (!request) {
    throw mineVerifyNotFound();
  }

  const status = getMineVerifyRequestStatus(request);

  if (status === 'expired' && !request.code) {
    throw mineVerifyConflict('Cette demande MineVerify est expirée.');
  }

  if (request.code && request.code !== input.code) {
    throw mineVerifyConflict('Un code différent est déjà enregistré pour cette demande.');
  }

  return updateMineVerifyRequest(input.requestId, (current) => ({
    ...current,
    code: input.code,
    expiresAt: new Date(input.expiresAt),
    updatedAt: new Date(),
  }));
}

export async function markMineVerifyValidated(input: MineVerifyValidatedInput) {
  const request = getMineVerifyRequest(input.requestId);

  if (!request) {
    throw mineVerifyNotFound();
  }

  if (!request.code) {
    throw mineVerifyConflict('Aucun code MineVerify enregistré pour cette demande.');
  }

  if (request.code !== input.code) {
    throw mineVerifyConflict('Le code MineVerify ne correspond pas à cette demande.');
  }

  if (request.expiredAt) {
    throw mineVerifyConflict('Cette demande MineVerify est expirée.');
  }

  if (getMineVerifyRequestStatus(request) === 'expired') {
    throw mineVerifyConflict('Cette demande MineVerify est expirée.');
  }

  if (request.validatedAt) {
    if (request.minecraftUuid === input.minecraftUuid) {
      return request;
    }

    throw mineVerifyConflict('Cette demande MineVerify est déjà validée avec un autre UUID.');
  }

  await persistMinecraftLink(request.userId, input);

  return updateMineVerifyRequest(input.requestId, (current) => ({
    ...current,
    minecraftUuid: input.minecraftUuid,
    minecraftName: input.minecraftName,
    validatedAt: new Date(input.validatedAt),
    updatedAt: new Date(),
  }));
}

export function markMineVerifyExpired(input: MineVerifyExpiredInput) {
  const request = getMineVerifyRequest(input.requestId);

  if (!request) {
    throw mineVerifyNotFound();
  }

  if (request.validatedAt) {
    throw mineVerifyConflict('Cette demande MineVerify est déjà validée.');
  }

  if (request.code && request.code !== input.code) {
    throw mineVerifyConflict('Le code MineVerify ne correspond pas à cette demande.');
  }

  return updateMineVerifyRequest(input.requestId, (current) => ({
    ...current,
    code: current.code ?? input.code,
    expiresAt: new Date(input.expiresAt),
    expiredAt: current.expiredAt ?? new Date(input.expiredAt),
    updatedAt: new Date(),
  }));
}

async function persistMinecraftLink(userId: string, input: MineVerifyValidatedInput) {
  try {
    await prisma.$transaction(async (tx) => {
      const [currentUser, existingLinkedUser] = await Promise.all([
        tx.user.findUnique({
          where: { id: userId },
          select: { minecraftUuid: true },
        }),
        tx.user.findUnique({
          where: { minecraftUuid: input.minecraftUuid },
          select: { id: true },
        }),
      ]);

      if (!currentUser) {
        throw mineVerifyNotFound('Utilisateur associé à la demande introuvable.');
      }

      if (currentUser.minecraftUuid && currentUser.minecraftUuid !== input.minecraftUuid) {
        throw mineVerifyConflict('Ce compte PMC Plan est déjà lié à un autre compte Minecraft.');
      }

      if (existingLinkedUser && existingLinkedUser.id !== userId) {
        throw mineVerifyConflict('Ce compte Minecraft est déjà lié à un autre compte PMC Plan.');
      }

      await tx.user.update({
        where: { id: userId },
        data: {
          minecraftUuid: input.minecraftUuid,
          minecraftName: input.minecraftName,
          minecraftLinkedAt: new Date(input.validatedAt),
        },
      });
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw mineVerifyConflict('Ce compte Minecraft est déjà lié à un autre compte PMC Plan.');
    }

    throw error;
  }
}

function linkedStatus(
  minecraftUuid: string,
  minecraftName: string | null,
  minecraftLinkedAt: Date
): MineVerifyPublicStatus {
  return {
    status: 'linked',
    minecraftUuid,
    minecraftName: minecraftName ?? undefined,
    minecraftLinkedAt: minecraftLinkedAt.toISOString(),
  };
}
