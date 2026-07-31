import { prisma } from '@/lib/prisma';
import type { MineVerifyRequestRecord, MineVerifyRequestStatus } from './types';

const PENDING_REQUEST_TTL_MS = 10 * 60 * 1000;
const TERMINAL_RETENTION_MS = 24 * 60 * 60 * 1000;
const CLEANUP_INTERVAL_MS = 60 * 1000;

let lastCleanupAt = 0;

export async function createMineVerifyRequest(userId: string) {
  await cleanupMineVerifyRequests(true);

  const now = new Date();

  return prisma.$transaction(async (tx) => {
    await tx.minecraftLinkRequest.updateMany({
      where: {
        userId,
        validatedAt: null,
        expiredAt: null,
      },
      data: { expiredAt: now },
    });

    return tx.minecraftLinkRequest.create({
      data: { userId },
    });
  });
}

export async function getPendingMineVerifyRequests() {
  await cleanupMineVerifyRequests();

  return prisma.minecraftLinkRequest.findMany({
    where: {
      code: null,
      validatedAt: null,
      expiredAt: null,
      createdAt: {
        gt: new Date(Date.now() - PENDING_REQUEST_TTL_MS),
      },
    },
    orderBy: { createdAt: 'asc' },
  });
}

export async function getMineVerifyRequest(requestId: string) {
  await cleanupMineVerifyRequests();
  return prisma.minecraftLinkRequest.findUnique({ where: { requestId } });
}

export async function getLatestMineVerifyRequestForUser(userId: string) {
  await cleanupMineVerifyRequests();
  return prisma.minecraftLinkRequest.findFirst({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function assignMineVerifyCode(
  requestId: string,
  code: string,
  expiresAt: Date,
) {
  return prisma.$transaction(async (tx) => {
    const result = await tx.minecraftLinkRequest.updateMany({
      where: {
        requestId,
        code: null,
        validatedAt: null,
        expiredAt: null,
      },
      data: { code, expiresAt },
    });

    const request = await tx.minecraftLinkRequest.findUnique({ where: { requestId } });
    return { updated: result.count === 1, request };
  });
}

export async function expireMineVerifyRequest(
  requestId: string,
  code: string,
  expiredAt: Date,
) {
  return prisma.$transaction(async (tx) => {
    const result = await tx.minecraftLinkRequest.updateMany({
      where: {
        requestId,
        validatedAt: null,
        expiredAt: null,
        OR: [{ code: null }, { code }],
      },
      data: { code, expiredAt },
    });

    const request = await tx.minecraftLinkRequest.findUnique({ where: { requestId } });
    return { updated: result.count === 1, request };
  });
}

export function getMineVerifyRequestStatus(request: MineVerifyRequestRecord): MineVerifyRequestStatus {
  const now = Date.now();

  if (request.validatedAt) {
    return 'validated';
  }

  if (request.expiredAt || (request.expiresAt && request.expiresAt.getTime() <= now)) {
    return 'expired';
  }

  if (!request.code && request.createdAt.getTime() + PENDING_REQUEST_TTL_MS <= now) {
    return 'expired';
  }

  if (request.code) {
    return 'code_created';
  }

  return 'pending';
}

async function cleanupMineVerifyRequests(force = false) {
  const now = new Date();

  if (!force && now.getTime() - lastCleanupAt < CLEANUP_INTERVAL_MS) {
    return;
  }

  lastCleanupAt = now.getTime();
  const pendingCutoff = new Date(now.getTime() - PENDING_REQUEST_TTL_MS);
  const terminalCutoff = new Date(now.getTime() - TERMINAL_RETENTION_MS);

  await prisma.$transaction(async (tx) => {
    await tx.minecraftLinkRequest.updateMany({
      where: {
        validatedAt: null,
        expiredAt: null,
        OR: [
          {
            code: null,
            createdAt: { lte: pendingCutoff },
          },
          {
            code: { not: null },
            expiresAt: { lte: now },
          },
        ],
      },
      data: { expiredAt: now },
    });

    await tx.minecraftLinkRequest.deleteMany({
      where: {
        OR: [
          { validatedAt: { lte: terminalCutoff } },
          { expiredAt: { lte: terminalCutoff } },
        ],
      },
    });
  });
}
