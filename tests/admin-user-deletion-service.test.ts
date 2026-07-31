import { prisma } from '@/lib/prisma';
import {
  AdminUserDeletionError,
  deleteUserAccount,
} from '@/lib/admin/user-deletion';
import { PRIMARY_MANAGEMENT_TRANSFER_REQUIRED } from '@/lib/admin/users';

jest.mock('@/lib/prisma', () => ({
  prisma: { $transaction: jest.fn() },
}));

const tx = {
  mapEntry: {
    findMany: jest.fn(),
    update: jest.fn(),
  },
  mapEntryManager: {
    deleteMany: jest.fn(),
  },
  space: {
    findMany: jest.fn(),
    update: jest.fn(),
  },
  spaceManager: {
    deleteMany: jest.fn(),
  },
  mapEntryOwner: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
    deleteMany: jest.fn(),
  },
};
const transactionMock = prisma.$transaction as jest.Mock;
const baseInput = {
  actorUserId: 'admin-user',
  expectedRole: 'user' as const,
  targetUserId: 'deleted-user',
};

describe('admin user deletion service', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    transactionMock.mockImplementation(
      async (operation: (client: typeof tx) => Promise<unknown>) => operation(tx),
    );
    tx.user.deleteMany.mockResolvedValue({ count: 1 });
    tx.space.findMany.mockResolvedValue([]);
  });

  it('requires a transfer target when primary entries remain', async () => {
    tx.mapEntry.findMany.mockResolvedValue([
      createAffectedEntry('entry-1', 'place'),
      createAffectedEntry('entry-2', 'portal'),
      createAffectedEntry('entry-3', 'service'),
    ]);
    tx.space.findMany.mockResolvedValue([
      { id: 'space-1', primaryManagerId: 'deleted-user' },
    ]);

    await expect(deleteUserAccount(baseInput)).rejects.toMatchObject({
      code: PRIMARY_MANAGEMENT_TRANSFER_REQUIRED,
      primaryManagedContent: {
        places: 1,
        portals: 1,
        services: 1,
        spaces: 1,
      },
      status: 409,
    });
    expect(tx.user.deleteMany).not.toHaveBeenCalled();
  });

  it('transfers every primary entry and deletes the account atomically', async () => {
    const updatedEntries = [
      createManagementRecord('entry-1'),
      createManagementRecord('entry-2'),
    ];
    tx.mapEntry.findMany
      .mockResolvedValueOnce([
        createAffectedEntry('entry-1', 'place'),
        createAffectedEntry('entry-2', 'portal'),
      ])
      .mockResolvedValueOnce(updatedEntries);
    tx.user.findUnique.mockResolvedValue({
      role: 'user',
      minecraftProfile: { uuid: 'next-primary-uuid' },
    });
    tx.mapEntryOwner.findUnique.mockResolvedValue(null);
    tx.mapEntryOwner.findFirst.mockResolvedValue({ position: 1 });

    const result = await deleteUserAccount({
      ...baseInput,
      transferToUserId: 'next-primary',
    });

    expect(tx.mapEntry.update).toHaveBeenCalledTimes(2);
    expect(tx.mapEntry.update).toHaveBeenCalledWith({
      where: { id: 'entry-1' },
      data: {
        primaryManagerId: 'next-primary',
        lastEditorId: 'admin-user',
      },
    });
    expect(tx.mapEntryManager.deleteMany).toHaveBeenCalledTimes(2);
    expect(tx.mapEntryOwner.create).toHaveBeenCalledTimes(2);
    expect(tx.user.deleteMany).toHaveBeenCalledWith({
      where: { id: 'deleted-user', role: 'user' },
    });
    expect(result.transferredEntryCount).toBe(2);
    expect(result.transferredSpaceCount).toBe(0);
    expect(result.managementUpdates).toHaveLength(2);
    expect(result.managementUpdates[0].lastEditor.editedAt).toEqual(
      new Date('2026-07-28T12:00:00.000Z'),
    );
  });

  it('rejects an account that cannot manage content', async () => {
    tx.mapEntry.findMany.mockResolvedValue([
      createAffectedEntry('entry-1', 'place'),
    ]);
    tx.user.findUnique.mockResolvedValue({
      role: 'pending',
      minecraftProfile: null,
    });

    await expect(deleteUserAccount({
      ...baseInput,
      transferToUserId: 'pending-user',
    })).rejects.toEqual(
      new AdminUserDeletionError(
        'Ce compte ne peut pas devenir gestionnaire principal.',
        400,
      ),
    );
    expect(tx.user.deleteMany).not.toHaveBeenCalled();
  });

  it('returns updated management for secondary relations removed by cascade', async () => {
    tx.mapEntry.findMany
      .mockResolvedValueOnce([
        createAffectedEntry('secondary-entry', 'place', 'other-user'),
      ])
      .mockResolvedValueOnce([
        createManagementRecord('secondary-entry'),
      ]);

    const result = await deleteUserAccount(baseInput);

    expect(tx.mapEntry.update).not.toHaveBeenCalled();
    expect(result.transferredEntryCount).toBe(0);
    expect(result.transferredSpaceCount).toBe(0);
    expect(result.managementUpdates[0].access.mapEntryId).toBe('secondary-entry');
  });

  it('transfers primary spaces before deleting the account', async () => {
    tx.mapEntry.findMany.mockResolvedValue([]);
    tx.space.findMany.mockResolvedValue([
      { id: 'space-1', primaryManagerId: 'deleted-user' },
    ]);
    tx.user.findUnique.mockResolvedValue({
      role: 'user',
      minecraftProfile: null,
    });

    const result = await deleteUserAccount({
      ...baseInput,
      transferToUserId: 'next-primary',
    });

    expect(tx.spaceManager.deleteMany).toHaveBeenCalledWith({
      where: { spaceId: 'space-1', userId: 'next-primary' },
    });
    expect(tx.space.update).toHaveBeenCalledWith({
      where: { id: 'space-1' },
      data: {
        primaryManagerId: 'next-primary',
        lastEditorId: 'admin-user',
      },
    });
    expect(result.transferredEntryCount).toBe(0);
    expect(result.transferredSpaceCount).toBe(1);
  });
});

function createManagementRecord(id: string) {
  return {
    id,
    primaryManagerId: 'next-primary',
    updatedAt: new Date('2026-07-28T12:00:00.000Z'),
    primaryManager: {
      id: 'next-primary',
      name: 'Next manager',
      username: 'next_manager',
      image: null,
      role: 'user',
      minecraftProfile: null,
    },
    lastEditor: {
      id: 'admin-user',
      name: 'Admin',
      username: 'admin',
      image: null,
    },
    managers: [],
    owners: [],
  };
}

function createAffectedEntry(
  id: string,
  type: 'place' | 'portal' | 'service',
  primaryManagerId = 'deleted-user',
) {
  return {
    id,
    primaryManagerId,
    place: type === 'place' ? { uid: `${id}-place` } : null,
    portals: type === 'portal' ? [{ uid: `${id}-portal` }] : [],
    service: type === 'service' ? { uid: `${id}-service` } : null,
  };
}
