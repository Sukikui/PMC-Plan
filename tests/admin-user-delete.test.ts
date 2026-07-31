import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { DELETE } from '@/app/api/admin/users/[id]/route';
import {
  AdminUserDeletionError,
  deleteUserAccount,
} from '@/lib/admin/user-deletion';
import { PRIMARY_MANAGEMENT_TRANSFER_REQUIRED } from '@/lib/admin/users';
import { prisma } from '@/lib/prisma';

jest.mock('@/lib/admin/user-deletion', () => {
  class MockAdminUserDeletionError extends Error {
    constructor(
      message: string,
      readonly status: number,
      readonly code?: string,
      readonly primaryManagedContent?: {
        places: number;
        portals: number;
        services: number;
        spaces: number;
      },
    ) {
      super(message);
      Object.setPrototypeOf(this, new.target.prototype);
    }
  }
  return {
    AdminUserDeletionError: MockAdminUserDeletionError,
    deleteUserAccount: jest.fn(),
  };
});

jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findUnique: jest.fn() },
    mapEntry: { count: jest.fn() },
  },
}));

const mockedAuth = auth as jest.Mock;
const mockedDeleteUserAccount = deleteUserAccount as jest.Mock;
const mockedPrisma = prisma as unknown as {
  user: { findUnique: jest.Mock };
};
const context = {
  params: Promise.resolve({ id: 'user-1' }),
};

const createRequest = (transferToUserId?: string) => new NextRequest(
  'http://localhost/api/admin/users/user-1',
  {
    method: 'DELETE',
    ...(transferToUserId
      ? {
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transferToUserId }),
        }
      : {}),
  },
);

describe('admin user deletion API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedAuth.mockResolvedValue({
      user: { id: 'super-admin-1', role: 'super_admin' },
    });
    mockedPrisma.user.findUnique.mockResolvedValue({ role: 'user' });
    mockedDeleteUserAccount.mockResolvedValue({
      managementUpdates: [],
      transferredEntryCount: 0,
      transferredSpaceCount: 0,
    });
  });

  it('allows a super admin to delete a regular account', async () => {
    const response = await DELETE(createRequest(), context);

    expect(response.status).toBe(200);
    expect(mockedDeleteUserAccount).toHaveBeenCalledWith({
      actorUserId: 'super-admin-1',
      expectedRole: 'user',
      targetUserId: 'user-1',
      transferToUserId: undefined,
    });
    await expect(response.json()).resolves.toEqual({
      managementUpdates: [],
      message: 'Compte supprimé.',
      transferredEntryCount: 0,
      transferredSpaceCount: 0,
    });
  });

  it('allows an admin to delete a regular account', async () => {
    mockedAuth.mockResolvedValue({
      user: { id: 'admin-1', role: 'admin' },
    });

    const response = await DELETE(createRequest(), context);

    expect(response.status).toBe(200);
    expect(mockedDeleteUserAccount).toHaveBeenCalledWith(
      expect.objectContaining({ actorUserId: 'admin-1' }),
    );
  });

  it('rejects deletion by a regular user', async () => {
    mockedAuth.mockResolvedValue({
      user: { id: 'user-2', role: 'user' },
    });

    const response = await DELETE(createRequest(), context);

    expect(response.status).toBe(403);
    expect(mockedPrisma.user.findUnique).not.toHaveBeenCalled();
  });

  it('prevents an admin from deleting another admin', async () => {
    mockedAuth.mockResolvedValue({
      user: { id: 'admin-1', role: 'admin' },
    });
    mockedPrisma.user.findUnique.mockResolvedValue({ role: 'admin' });

    const response = await DELETE(createRequest(), context);

    expect(response.status).toBe(403);
    expect(mockedDeleteUserAccount).not.toHaveBeenCalled();
  });

  it('prevents deleting the active Super Admin account', async () => {
    const response = await DELETE(createRequest(), {
      params: Promise.resolve({ id: 'super-admin-1' }),
    });

    expect(response.status).toBe(403);
    expect(mockedPrisma.user.findUnique).not.toHaveBeenCalled();
  });

  it('prevents deleting another Super Admin account', async () => {
    mockedPrisma.user.findUnique.mockResolvedValue({
      role: 'super_admin',
    });

    const response = await DELETE(createRequest(), context);

    expect(response.status).toBe(403);
    expect(mockedDeleteUserAccount).not.toHaveBeenCalled();
  });

  it('returns not found for an unknown account', async () => {
    mockedPrisma.user.findUnique.mockResolvedValue(null);

    const response = await DELETE(createRequest(), context);

    expect(response.status).toBe(404);
    expect(mockedDeleteUserAccount).not.toHaveBeenCalled();
  });

  it('returns structured transfer requirements for primary managers', async () => {
    mockedDeleteUserAccount.mockRejectedValue(
      new AdminUserDeletionError(
        'Un nouveau gestionnaire principal doit être sélectionné.',
        409,
        PRIMARY_MANAGEMENT_TRANSFER_REQUIRED,
        { places: 2, portals: 1, services: 1, spaces: 1 },
      ),
    );

    const response = await DELETE(createRequest(), context);

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      error: 'Un nouveau gestionnaire principal doit être sélectionné.',
      code: PRIMARY_MANAGEMENT_TRANSFER_REQUIRED,
      primaryManagedContent: {
        places: 2,
        portals: 1,
        services: 1,
        spaces: 1,
      },
    });
  });

  it('rejects deletion when the account role changed concurrently', async () => {
    mockedDeleteUserAccount.mockRejectedValue(
      new AdminUserDeletionError(
        'Le compte a été modifié. Recharge la liste avant de réessayer.',
        409,
      ),
    );

    const response = await DELETE(createRequest(), context);

    expect(response.status).toBe(409);
  });

  it('passes the selected transfer target to the deletion service', async () => {
    mockedDeleteUserAccount.mockResolvedValue({
      managementUpdates: [],
      transferredEntryCount: 2,
      transferredSpaceCount: 1,
    });

    const response = await DELETE(createRequest('next-primary'), context);

    expect(response.status).toBe(200);
    expect(mockedDeleteUserAccount).toHaveBeenCalledWith(
      expect.objectContaining({ transferToUserId: 'next-primary' }),
    );
  });
});
