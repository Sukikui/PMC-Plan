import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import {
  assignMineVerifyCode,
  expireMineVerifyRequest,
  getMineVerifyRequest,
  getMineVerifyRequestStatus,
} from '../lib/mineverify/store';
import {
  markMineVerifyCodeCreated,
  markMineVerifyExpired,
  markMineVerifyValidated,
  unlinkMinecraftAccount,
} from '../lib/mineverify/service';
import type { MineVerifyRequestRecord } from '../lib/mineverify/types';

jest.mock('../lib/prisma', () => ({
  prisma: {
    $transaction: jest.fn(),
  },
}));

jest.mock('../lib/mineverify/store', () => ({
  assignMineVerifyCode: jest.fn(),
  createMineVerifyRequest: jest.fn(),
  expireMineVerifyRequest: jest.fn(),
  getLatestMineVerifyRequestForUser: jest.fn(),
  getMineVerifyRequest: jest.fn(),
  getMineVerifyRequestStatus: jest.fn(),
  getPendingMineVerifyRequests: jest.fn(),
}));

const request = (
  overrides: Partial<MineVerifyRequestRecord> = {},
): MineVerifyRequestRecord => ({
  requestId: 'request-1',
  userId: 'user-1',
  code: null,
  expiresAt: null,
  minecraftUuid: null,
  minecraftName: null,
  validatedAt: null,
  expiredAt: null,
  createdAt: new Date('2026-06-04T16:00:00Z'),
  updatedAt: new Date('2026-06-04T16:00:00Z'),
  ...overrides,
});

const transactionClient = {
  minecraftLinkRequest: {
    deleteMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
  },
  minecraftProfile: {
    findUnique: jest.fn(),
    upsert: jest.fn(),
    updateMany: jest.fn(),
  },
};

const transactionMock = prisma.$transaction as jest.Mock;
const getRequestMock = getMineVerifyRequest as jest.Mock;
const getStatusMock = getMineVerifyRequestStatus as jest.Mock;
const assignCodeMock = assignMineVerifyCode as jest.Mock;
const expireRequestMock = expireMineVerifyRequest as jest.Mock;

describe('MineVerify request service', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    getStatusMock.mockReturnValue('pending');
    transactionMock.mockImplementation(
      async (operation: (tx: typeof transactionClient) => Promise<unknown>) =>
        operation(transactionClient),
    );
  });

  describe('code creation', () => {
    it('accepts an identical plugin retry without rewriting the request', async () => {
      const existing = request({ code: 'K7M9-P2Q4' });
      getRequestMock.mockResolvedValue(existing);

      await expect(markMineVerifyCodeCreated({
        requestId: existing.requestId,
        code: existing.code!,
        expiresAt: '2026-06-04T16:05:00Z',
      })).resolves.toBe(existing);

      expect(assignCodeMock).not.toHaveBeenCalled();
    });

    it('rejects a different code received during a concurrent update', async () => {
      const pending = request();
      getRequestMock.mockResolvedValue(pending);
      assignCodeMock.mockResolvedValue({
        updated: false,
        request: request({ code: 'OTHER-CODE' }),
      });

      await expect(markMineVerifyCodeCreated({
        requestId: pending.requestId,
        code: 'K7M9-P2Q4',
        expiresAt: '2026-06-04T16:05:00Z',
      })).rejects.toMatchObject({ statusCode: 409 });
    });
  });

  describe('expiration', () => {
    it('accepts repeated expiration callbacks', async () => {
      const expired = request({
        code: 'K7M9-P2Q4',
        expiredAt: new Date('2026-06-04T16:05:00Z'),
      });
      getRequestMock.mockResolvedValue(expired);

      await expect(markMineVerifyExpired({
        requestId: expired.requestId,
        code: expired.code!,
      })).resolves.toBe(expired);

      expect(expireRequestMock).not.toHaveBeenCalled();
    });
  });

  describe('validation', () => {
    const input = {
      requestId: 'request-1',
      code: 'K7M9-P2Q4',
      minecraftUuid: '6f8f5771-8ec8-4b8d-bc40-8cbe2f84f5a3',
      minecraftName: 'PlayerName',
      validatedAt: '2026-06-04T16:02:20Z',
    };

    it('persists the user link and terminal request in one transaction', async () => {
      const pending = request({
        code: input.code,
        expiresAt: new Date('2026-06-04T16:05:00Z'),
      });
      const validated = request({
        ...pending,
        minecraftUuid: input.minecraftUuid,
        minecraftName: input.minecraftName,
        validatedAt: new Date(input.validatedAt),
      });

      transactionClient.minecraftLinkRequest.findUnique.mockResolvedValue(pending);
      transactionClient.user.findUnique.mockResolvedValue({
        minecraftProfile: null,
      });
      transactionClient.minecraftProfile.findUnique.mockResolvedValue(null);
      transactionClient.minecraftLinkRequest.update.mockResolvedValue(validated);

      await expect(markMineVerifyValidated(input)).resolves.toBe(validated);

      expect(transactionClient.minecraftProfile.upsert).toHaveBeenCalledWith({
        where: { uuid: input.minecraftUuid },
        create: {
          uuid: input.minecraftUuid,
          name: input.minecraftName,
          linkedUserId: pending.userId,
          linkedAt: new Date(input.validatedAt),
        },
        update: {
          name: input.minecraftName,
          linkedUserId: pending.userId,
          linkedAt: new Date(input.validatedAt),
        },
      });
      expect(transactionMock).toHaveBeenCalledWith(
        expect.any(Function),
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
    });

    it('returns an already validated request for an identical retry', async () => {
      const validated = request({
        code: input.code,
        minecraftUuid: input.minecraftUuid,
        minecraftName: input.minecraftName,
        validatedAt: new Date(input.validatedAt),
      });
      transactionClient.minecraftLinkRequest.findUnique.mockResolvedValue(validated);
      getStatusMock.mockReturnValue('validated');

      await expect(markMineVerifyValidated(input)).resolves.toBe(validated);
      expect(transactionClient.minecraftProfile.upsert).not.toHaveBeenCalled();
    });

    it('rejects an UUID already linked to another user', async () => {
      transactionClient.minecraftLinkRequest.findUnique.mockResolvedValue(request({
        code: input.code,
        expiresAt: new Date('2026-06-04T16:05:00Z'),
      }));
      transactionClient.user.findUnique.mockResolvedValue({
        minecraftProfile: null,
      });
      transactionClient.minecraftProfile.findUnique.mockResolvedValue({
        linkedUserId: 'other-user',
      });

      await expect(markMineVerifyValidated(input))
        .rejects.toMatchObject({ statusCode: 409 });
      expect(transactionClient.minecraftProfile.upsert).not.toHaveBeenCalled();
    });

    it('retries a serializable transaction conflict', async () => {
      const conflict = new Prisma.PrismaClientKnownRequestError(
        'Concurrent transaction conflict',
        { code: 'P2034', clientVersion: '6.18.0' },
      );
      const validated = request({
        code: input.code,
        minecraftUuid: input.minecraftUuid,
        minecraftName: input.minecraftName,
        validatedAt: new Date(input.validatedAt),
      });

      transactionMock
        .mockRejectedValueOnce(conflict)
        .mockImplementationOnce(
          async (operation: (tx: typeof transactionClient) => Promise<unknown>) => {
            transactionClient.minecraftLinkRequest.findUnique.mockResolvedValue(validated);
            getStatusMock.mockReturnValue('validated');
            return operation(transactionClient);
          },
        );

      await expect(markMineVerifyValidated(input)).resolves.toBe(validated);
      expect(transactionMock).toHaveBeenCalledTimes(2);
    });
  });

  it('clears the user link and temporary requests atomically', async () => {
    await expect(unlinkMinecraftAccount('user-1')).resolves.toEqual({
      status: 'not_started',
    });

    expect(transactionClient.minecraftProfile.updateMany).toHaveBeenCalledWith({
      where: { linkedUserId: 'user-1' },
      data: {
        linkedUserId: null,
        linkedAt: null,
      },
    });
    expect(transactionClient.minecraftLinkRequest.deleteMany).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
    });
  });
});
