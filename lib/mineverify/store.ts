import { randomUUID } from 'crypto';
import type { MineVerifyRequestRecord, MineVerifyRequestStatus } from './types';

const PENDING_REQUEST_TTL_MS = 10 * 60 * 1000;
const TERMINAL_RETENTION_MS = 10 * 60 * 1000;

interface MineVerifyMemoryStore {
  requests: Map<string, MineVerifyRequestRecord>;
}

const globalForMineVerify = globalThis as unknown as {
  mineVerifyStore: MineVerifyMemoryStore | undefined;
};

const store = globalForMineVerify.mineVerifyStore ?? {
  requests: new Map<string, MineVerifyRequestRecord>(),
};

if (process.env.NODE_ENV !== 'production') {
  globalForMineVerify.mineVerifyStore = store;
}

export function createMineVerifyRequest(userId: string) {
  cleanupMineVerifyRequests();
  expireOpenRequestsForUser(userId);

  const now = new Date();
  const request: MineVerifyRequestRecord = {
    requestId: randomUUID(),
    userId,
    code: null,
    expiresAt: null,
    minecraftUuid: null,
    minecraftName: null,
    validatedAt: null,
    expiredAt: null,
    createdAt: now,
    updatedAt: now,
  };

  store.requests.set(request.requestId, request);
  return request;
}

export function getPendingMineVerifyRequests() {
  cleanupMineVerifyRequests();

  return Array.from(store.requests.values()).filter(
    (request) => getMineVerifyRequestStatus(request) === 'pending'
  );
}

export function getMineVerifyRequest(requestId: string) {
  cleanupMineVerifyRequests();
  return store.requests.get(requestId) ?? null;
}

export function getLatestMineVerifyRequestForUser(userId: string) {
  cleanupMineVerifyRequests();

  return Array.from(store.requests.values())
    .filter((request) => request.userId === userId)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0] ?? null;
}

export function clearMineVerifyRequestsForUser(userId: string) {
  for (const [requestId, request] of Array.from(store.requests.entries())) {
    if (request.userId === userId) {
      store.requests.delete(requestId);
    }
  }
}

export function updateMineVerifyRequest(
  requestId: string,
  updater: (request: MineVerifyRequestRecord) => MineVerifyRequestRecord
) {
  const current = store.requests.get(requestId);

  if (!current) {
    return null;
  }

  const updated = updater(current);
  store.requests.set(requestId, updated);
  return updated;
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

function expireOpenRequestsForUser(userId: string) {
  const now = new Date();

  for (const request of Array.from(store.requests.values())) {
    const status = getMineVerifyRequestStatus(request);

    if (request.userId === userId && (status === 'pending' || status === 'code_created')) {
      request.expiredAt = now;
      request.updatedAt = now;
    }
  }
}

function cleanupMineVerifyRequests() {
  const now = Date.now();

  for (const [requestId, request] of Array.from(store.requests.entries())) {
    const status = getMineVerifyRequestStatus(request);
    const terminalAt = request.validatedAt ?? request.expiredAt;
    const isStalePending = status === 'expired' && !terminalAt && request.createdAt.getTime() + PENDING_REQUEST_TTL_MS <= now;
    const isStaleTerminal = terminalAt && terminalAt.getTime() + TERMINAL_RETENTION_MS <= now;

    if (isStalePending || isStaleTerminal) {
      store.requests.delete(requestId);
    }
  }
}
