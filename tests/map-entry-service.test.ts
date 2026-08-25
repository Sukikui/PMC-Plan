import { prisma } from '@/lib/prisma';
import { createMapEntry } from '@/lib/map-entry/service';
import {
  claimMapEntryManagement,
  updateMapEntryManagement,
} from '@/lib/map-entry/management-update';
import { toMapEntryDraft } from '@/lib/map-entry/types';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    $transaction: jest.fn(),
  },
}));

jest.mock('@/lib/minecraft/profiles', () => ({
  upsertMinecraftProfile: jest.fn(),
}));

const tx = {
  user: {
    findMany: jest.fn(),
  },
  mapEntry: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  mapEntryManager: {
    createMany: jest.fn(),
    deleteMany: jest.fn(),
  },
  mapEntryOwner: {
    createMany: jest.fn(),
    deleteMany: jest.fn(),
  },
};

const transactionMock = prisma.$transaction as jest.Mock;
const primaryActor = { userId: 'primary-user', role: 'user' };

describe('map-entry service', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    transactionMock.mockImplementation(
      async (operation: (client: typeof tx) => Promise<unknown>) => operation(tx),
    );
  });

  it('creates managers first and includes their linked Minecraft profiles', async () => {
    tx.user.findMany.mockResolvedValue([
      {
        id: 'primary-user',
        role: 'user',
        minecraftProfile: { uuid: 'primary-uuid', name: 'PrimaryMC' },
      },
      {
        id: 'manager-user',
        role: 'user',
        minecraftProfile: { uuid: 'manager-uuid', name: 'ManagerMC' },
      },
    ]);
    tx.mapEntry.create.mockResolvedValue({ id: 'entry-1' });

    await createMapEntry(tx as never, 'primary-user', {
      color: '#1F2A65',
      images: ['https://example.com/portal.png'],
      managerIds: ['manager-user'],
      owners: [
        { uuid: 'manager-uuid', name: 'ManagerMC' },
        { uuid: 'manual-uuid', name: 'ManualMC' },
      ],
      excludedOwnerUuids: [],
      spaceId: 'space-1',
    });

    expect(tx.mapEntry.create).toHaveBeenCalledWith({
      data: {
        color: '#1F2A65',
        images: ['https://example.com/portal.png'],
        spaceId: 'space-1',
        primaryManagerId: 'primary-user',
        lastEditorId: 'primary-user',
        managers: { create: [{ userId: 'manager-user' }] },
        owners: {
          create: [
            { profileUuid: 'primary-uuid', position: 0 },
            { profileUuid: 'manager-uuid', position: 1 },
            { profileUuid: 'manual-uuid', position: 2 },
          ],
        },
      },
    });
  });

  it('respects removal of an automatically suggested owner during creation', async () => {
    tx.user.findMany.mockResolvedValue([
      {
        id: 'primary-user',
        role: 'user',
        minecraftProfile: { uuid: 'primary-uuid', name: 'PrimaryMC' },
      },
      {
        id: 'manager-user',
        role: 'user',
        minecraftProfile: { uuid: 'manager-uuid', name: 'ManagerMC' },
      },
    ]);

    await createMapEntry(tx as never, 'primary-user', {
      managerIds: ['manager-user'],
      owners: [],
      excludedOwnerUuids: ['manager-uuid'],
    });

    expect(tx.mapEntry.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        owners: {
          create: [{ profileUuid: 'primary-uuid', position: 0 }],
        },
      }),
    });
  });

  it('creates an unidentified entry without Minecraft owners', async () => {
    tx.user.findMany.mockResolvedValue([
      {
        id: 'primary-user',
        role: 'user',
        minecraftProfile: { uuid: 'primary-uuid', name: 'PrimaryMC' },
      },
    ]);

    await createMapEntry(tx as never, 'primary-user', {
      includeManagerOwners: false,
      managerIds: [],
      owners: [{ uuid: 'manual-uuid', name: 'ManualMC' }],
      excludedOwnerUuids: [],
    });

    expect(tx.mapEntry.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ owners: undefined }),
    });
  });

  it('updates managers and owners through the content transaction', async () => {
    tx.mapEntry.findUnique.mockResolvedValue({
      primaryManagerId: 'primary-user',
      managers: [{ userId: 'old-manager' }],
    });
    tx.user.findMany.mockResolvedValue([
      {
        id: 'primary-user',
        role: 'user',
        discordUsername: 'primary',
        minecraftProfile: { uuid: 'primary-uuid', name: 'PrimaryMC' },
      },
      {
        id: 'new-manager',
        role: 'user',
        discordUsername: 'manager',
        minecraftProfile: { uuid: 'manager-uuid', name: 'ManagerMC' },
      },
    ]);

    await updateMapEntryManagement(tx as never, 'entry-1', primaryActor, {
      managerIds: ['new-manager'],
      owners: [{ uuid: 'manual-uuid', name: 'ManualMC' }],
      excludedOwnerUuids: ['manager-uuid'],
      primaryManagerId: 'primary-user',
    });

    expect(tx.mapEntryManager.deleteMany).toHaveBeenCalledWith({
      where: { mapEntryId: 'entry-1' },
    });
    expect(tx.mapEntryManager.createMany).toHaveBeenCalledWith({
      data: [{ mapEntryId: 'entry-1', userId: 'new-manager' }],
    });
    expect(tx.mapEntryOwner.createMany).toHaveBeenCalledWith({
      data: [
        {
          mapEntryId: 'entry-1',
          profileUuid: 'primary-uuid',
          position: 0,
        },
        {
          mapEntryId: 'entry-1',
          profileUuid: 'manual-uuid',
          position: 1,
        },
      ],
    });
  });

  it('requires the target Discord username when the primary manager changes', async () => {
    tx.mapEntry.findUnique.mockResolvedValue({
      primaryManagerId: 'primary-user',
      managers: [{ userId: 'next-primary' }],
    });
    tx.user.findMany.mockResolvedValue([
      {
        id: 'next-primary',
        role: 'user',
        discordUsername: 'next_primary',
        minecraftProfile: null,
      },
      {
        id: 'primary-user',
        role: 'user',
        discordUsername: 'primary',
        minecraftProfile: null,
      },
    ]);

    await expect(updateMapEntryManagement(
      tx as never,
      'entry-1',
      primaryActor,
      {
        managerIds: ['primary-user'],
        owners: [],
        excludedOwnerUuids: [],
        primaryManagerId: 'next-primary',
        transferConfirmation: '@wrong',
      },
    )).rejects.toMatchObject({
      status: 400,
      message: 'La confirmation ne correspond pas à l’identifiant Discord.',
    });

    expect(tx.mapEntryManager.deleteMany).not.toHaveBeenCalled();
  });

  it('lets a secondary manager update owners without rewriting the team', async () => {
    tx.mapEntry.findUnique.mockResolvedValue({
      primaryManagerId: 'primary-user',
      managers: [{ userId: 'secondary-user' }],
    });
    tx.user.findMany.mockResolvedValue([
      {
        id: 'primary-user',
        role: 'user',
        discordUsername: 'primary',
        minecraftProfile: null,
      },
      {
        id: 'secondary-user',
        role: 'user',
        discordUsername: 'secondary',
        minecraftProfile: null,
      },
    ]);

    await updateMapEntryManagement(
      tx as never,
      'entry-1',
      { userId: 'secondary-user', role: 'user' },
      {
        managerIds: ['secondary-user'],
        owners: [{ uuid: 'manual-uuid', name: 'ManualMC' }],
        excludedOwnerUuids: [],
        primaryManagerId: 'primary-user',
      },
    );

    expect(tx.mapEntryManager.deleteMany).not.toHaveBeenCalled();
    expect(tx.mapEntryOwner.createMany).toHaveBeenCalled();
  });

  it('replaces unidentified portal management when it is claimed', async () => {
    tx.mapEntry.findUnique.mockResolvedValue({
      primaryManagerId: 'claiming-user',
      managers: [{ userId: 'old-manager' }],
    });
    tx.user.findMany.mockResolvedValue([
      {
        id: 'claiming-user',
        role: 'user',
        discordUsername: 'claiming',
        minecraftProfile: { uuid: 'claiming-uuid', name: 'ClaimingMC' },
      },
    ]);

    await claimMapEntryManagement(
      tx as never,
      'entry-1',
      { userId: 'claiming-user', role: 'user' },
      {
        managerIds: [],
        owners: [],
        excludedOwnerUuids: [],
      },
    );

    expect(tx.mapEntry.update).toHaveBeenNthCalledWith(1, {
      where: { id: 'entry-1' },
      data: { primaryManagerId: 'claiming-user' },
    });
    expect(tx.mapEntryManager.deleteMany).toHaveBeenCalledWith({
      where: { mapEntryId: 'entry-1' },
    });
    expect(tx.mapEntryOwner.createMany).toHaveBeenCalledWith({
      data: [{
        mapEntryId: 'entry-1',
        profileUuid: 'claiming-uuid',
        position: 0,
      }],
    });
  });

  it('prevents a secondary manager from changing the Discord team', async () => {
    tx.mapEntry.findUnique.mockResolvedValue({
      primaryManagerId: 'primary-user',
      managers: [{ userId: 'secondary-user' }],
    });

    await expect(updateMapEntryManagement(
      tx as never,
      'entry-1',
      { userId: 'secondary-user', role: 'user' },
      {
        managerIds: ['secondary-user', 'new-manager'],
        owners: [],
        excludedOwnerUuids: [],
        primaryManagerId: 'primary-user',
      },
    )).rejects.toMatchObject({
      status: 403,
      message: 'Seul le gestionnaire principal peut modifier l’équipe.',
    });

    expect(tx.user.findMany).not.toHaveBeenCalled();
  });

  it('preserves an excluded linked owner when initializing the edit draft', () => {
    const primaryManager = {
      id: 'primary-user',
      name: 'Primary',
      username: 'primary',
      image: null,
      role: 'user' as const,
      minecraftProfile: { uuid: 'primary-uuid', name: 'PrimaryMC' },
    };
    const draft = toMapEntryDraft({
      access: {
        mapEntryId: 'entry-1',
        primaryManagerId: primaryManager.id,
        managerIds: [],
      },
      lastEditor: {
        id: primaryManager.id,
        name: primaryManager.name,
        username: primaryManager.username,
        image: null,
        editedAt: new Date(),
      },
      primaryManager,
      managers: [],
      owners: [],
    });

    expect(draft.excludedOwnerUuids).toEqual(['primary-uuid']);
  });

});
