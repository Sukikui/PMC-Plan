import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { mineVerifyConflict, mineVerifyNotFound } from './errors';
import {
  assignMineVerifyCode,
  createMineVerifyRequest,
  expireMineVerifyRequest,
  getLatestMineVerifyRequestForUser,
  getMineVerifyRequest,
  getMineVerifyRequestStatus,
  getPendingMineVerifyRequests,
} from './store';
import type {
  MineVerifyCodeCreatedInput,
  MineVerifyExpiredInput,
  MineVerifyValidatedInput,
} from './schemas';
import type { MineVerifyPublicStatus } from './types';

const TRANSACTION_RETRY_LIMIT = 3;
const minecraftProfileSelect = {
  uuid: true,
  name: true,
  linkedAt: true,
} as const;

export async function createMinecraftLinkRequest(userId: string): Promise<MineVerifyPublicStatus> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { minecraftProfile: { select: minecraftProfileSelect } },
  });

  if (user?.minecraftProfile?.linkedAt) {
    return linkedStatus(
      user.minecraftProfile.uuid,
      user.minecraftProfile.name,
      user.minecraftProfile.linkedAt,
    );
  }

  const request = await createMineVerifyRequest(userId);
  return { status: 'pending', requestId: request.requestId };
}

export async function getMinecraftLinkStatus(userId: string): Promise<MineVerifyPublicStatus> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { minecraftProfile: { select: minecraftProfileSelect } },
  });

  if (user?.minecraftProfile?.linkedAt) {
    return linkedStatus(
      user.minecraftProfile.uuid,
      user.minecraftProfile.name,
      user.minecraftProfile.linkedAt,
    );
  }

  const request = await getLatestMineVerifyRequestForUser(userId);

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

export async function listPendingMineVerifyRequests() {
  const requests = await getPendingMineVerifyRequests();
  return requests.map((request) => ({
    requestId: request.requestId,
  }));
}

export async function unlinkMinecraftAccount(userId: string): Promise<MineVerifyPublicStatus> {
  await runSerializableTransaction(async (tx) => {
    await tx.minecraftProfile.updateMany({
      where: { linkedUserId: userId },
      data: {
        linkedUserId: null,
        linkedAt: null,
      },
    });

    await tx.minecraftLinkRequest.deleteMany({ where: { userId } });
  });

  return { status: 'not_started' };
}

export async function markMineVerifyCodeCreated(input: MineVerifyCodeCreatedInput) {
  const request = await getMineVerifyRequest(input.requestId);

  if (!request) {
    throw mineVerifyNotFound();
  }

  if (request.code) {
    if (request.code !== input.code) {
      throw mineVerifyConflict('Un code différent est déjà enregistré pour cette demande.');
    }
    return request;
  }

  if (getMineVerifyRequestStatus(request) === 'expired') {
    throw mineVerifyConflict('Cette demande MineVerify est expirée.');
  }

  const result = await assignMineVerifyCode(
    input.requestId,
    input.code,
    new Date(input.expiresAt),
  );

  if (!result.request) {
    throw mineVerifyNotFound();
  }

  if (result.updated || result.request.code === input.code) {
    return result.request;
  }

  if (result.request.code) {
    throw mineVerifyConflict('Un code différent est déjà enregistré pour cette demande.');
  }

  throw mineVerifyConflict('Cette demande MineVerify ne peut plus recevoir de code.');
}

export async function markMineVerifyValidated(input: MineVerifyValidatedInput) {
  try {
    return await runSerializableTransaction(async (tx) => {
      const request = await tx.minecraftLinkRequest.findUnique({
        where: { requestId: input.requestId },
      });

      if (!request) {
        throw mineVerifyNotFound();
      }

      if (!request.code) {
        throw mineVerifyConflict('Aucun code MineVerify enregistré pour cette demande.');
      }

      if (request.code !== input.code) {
        throw mineVerifyConflict('Le code MineVerify ne correspond pas à cette demande.');
      }

      if (request.expiredAt || getMineVerifyRequestStatus(request) === 'expired') {
        throw mineVerifyConflict('Cette demande MineVerify est expirée.');
      }

      if (request.validatedAt) {
        if (request.minecraftUuid === input.minecraftUuid) {
          return request;
        }
        throw mineVerifyConflict('Cette demande MineVerify est déjà validée avec un autre UUID.');
      }

      const [currentUser, existingLinkedUser] = await Promise.all([
        tx.user.findUnique({
          where: { id: request.userId },
          select: {
            minecraftProfile: {
              select: { uuid: true },
            },
          },
        }),
        tx.minecraftProfile.findUnique({
          where: { uuid: input.minecraftUuid },
          select: { linkedUserId: true },
        }),
      ]);

      if (!currentUser) {
        throw mineVerifyNotFound('Utilisateur associé à la demande introuvable.');
      }

      if (
        currentUser.minecraftProfile &&
        currentUser.minecraftProfile.uuid !== input.minecraftUuid
      ) {
        throw mineVerifyConflict('Ce compte PMC Plan est déjà lié à un autre compte Minecraft.');
      }

      if (
        existingLinkedUser?.linkedUserId &&
        existingLinkedUser.linkedUserId !== request.userId
      ) {
        throw mineVerifyConflict('Ce compte Minecraft est déjà lié à un autre compte PMC Plan.');
      }

      await tx.minecraftProfile.upsert({
        where: { uuid: input.minecraftUuid },
        create: {
          uuid: input.minecraftUuid,
          name: input.minecraftName,
          linkedUserId: request.userId,
          linkedAt: new Date(input.validatedAt),
        },
        update: {
          name: input.minecraftName,
          linkedUserId: request.userId,
          linkedAt: new Date(input.validatedAt),
        },
      });

      return tx.minecraftLinkRequest.update({
        where: { requestId: input.requestId },
        data: {
          minecraftUuid: input.minecraftUuid,
          minecraftName: input.minecraftName,
          validatedAt: new Date(input.validatedAt),
          updatedAt: new Date(),
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

export async function markMineVerifyExpired(input: MineVerifyExpiredInput) {
  const request = await getMineVerifyRequest(input.requestId);

  if (!request) {
    throw mineVerifyNotFound();
  }

  if (request.validatedAt) {
    throw mineVerifyConflict('Cette demande MineVerify est déjà validée.');
  }

  if (request.code && request.code !== input.code) {
    throw mineVerifyConflict('Le code MineVerify ne correspond pas à cette demande.');
  }

  if (request.expiredAt) {
    return request;
  }

  const result = await expireMineVerifyRequest(
    input.requestId,
    input.code,
    new Date(),
  );

  if (!result.request) {
    throw mineVerifyNotFound();
  }

  if (result.updated || result.request.expiredAt) {
    return result.request;
  }

  if (result.request.validatedAt) {
    throw mineVerifyConflict('Cette demande MineVerify est déjà validée.');
  }

  if (result.request.code && result.request.code !== input.code) {
    throw mineVerifyConflict('Le code MineVerify ne correspond pas à cette demande.');
  }

  throw mineVerifyConflict('Cette demande MineVerify ne peut plus être expirée.');
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

async function runSerializableTransaction<T>(
  operation: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  for (let attempt = 1; attempt <= TRANSACTION_RETRY_LIMIT; attempt += 1) {
    try {
      return await prisma.$transaction(operation, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      });
    } catch (error) {
      const canRetry =
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2034' &&
        attempt < TRANSACTION_RETRY_LIMIT;

      if (!canRetry) {
        throw error;
      }
    }
  }

  throw new Error('MineVerify transaction retry limit reached.');
}
