import { prisma } from '@/lib/prisma';
import {
  createSpace,
  deleteSpace,
  transferSpace,
  updateSpace,
} from '@/lib/spaces/service';

jest.mock('@/lib/prisma', () => ({
  prisma: { $transaction: jest.fn() },
}));

const tx = {
  space: {
    create: jest.fn(),
    delete: jest.fn(),
    findUnique: jest.fn(),
    findUniqueOrThrow: jest.fn(),
    update: jest.fn(),
  },
  spaceManager: {
    deleteMany: jest.fn(),
    upsert: jest.fn(),
  },
  user: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
  },
};
const transactionMock = prisma.$transaction as jest.Mock;
const actor = { userId: 'primary-user', role: 'user' };
const input = {
  name: 'Quartier central',
  slug: 'quartier-central',
  description: 'Centre commercial.',
  color: '#3B82F6',
  logoUrl: null,
  logoBackground: 'transparent' as const,
  logoZoom: 1.5,
  discordUrl: 'https://discord.gg/valnyfrost',
  managerIds: ['manager-user'],
};

describe('space service', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    transactionMock.mockImplementation(
      async (operation: (client: typeof tx) => Promise<unknown>) => operation(tx),
    );
  });

  it('creates an autonomous space with approved secondary managers', async () => {
    tx.user.findMany.mockResolvedValue([
      { id: 'manager-user', role: 'user' },
    ]);
    tx.space.create.mockResolvedValue(createSpaceRecord());

    const result = await createSpace(actor, input);

    expect(tx.space.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        discordUrl: 'https://discord.gg/valnyfrost',
        logoBackground: 'transparent',
        logoZoom: 1.5,
        primaryManagerId: 'primary-user',
        managers: { create: [{ userId: 'manager-user' }] },
      }),
    }));
    expect(result.slug).toBe('quartier-central');
    expect(result.offerCount).toBe(2);
    expect(result.members).toEqual([
      { uuid: 'member-a', name: 'Alex' },
      { uuid: 'member-b', name: 'Suki' },
    ]);
    expect(result.images).toEqual([
      {
        id: 'place-1-0',
        url: 'https://example.com/place-1.png',
        placeId: 'place-1',
        placeSlug: 'place-centrale',
        placeName: 'Place centrale',
      },
      {
        id: 'place-1-1',
        url: 'https://example.com/place-2.png',
        placeId: 'place-1',
        placeSlug: 'place-centrale',
        placeName: 'Place centrale',
      },
    ]);
    expect(result.places).toEqual([
      {
        category: 'construction',
        mapEntryId: 'entry-place',
        name: 'Place centrale',
        owners: [
          { uuid: 'member-b', name: 'Suki' },
          { uuid: 'member-a', name: 'Alex' },
        ],
        slug: 'place-centrale',
        world: 'overworld',
      },
    ]);
    expect(result.portals).toEqual([
      {
        linked: true,
        mapEntryId: 'entry-portal',
        name: 'Portail central',
        owners: [{ uuid: 'member-b', name: 'Suki' }],
        slug: 'portail-central',
        world: 'overworld',
      },
    ]);
  });

  it('lets a secondary manager edit content without changing the team', async () => {
    tx.space.findUnique.mockResolvedValue(createSpaceAccess());
    tx.space.update.mockResolvedValue(createSpaceRecord());

    await updateSpace(
      'quartier-central',
      { userId: 'manager-user', role: 'user' },
      {
        name: 'Quartier central',
        slug: 'quartier-central',
        description: 'Description modifiée.',
        color: '#10B981',
        logoUrl: null,
        logoBackground: 'color',
        logoZoom: 2,
        discordUrl: null,
        managerIds: [],
      },
    );

    expect(tx.user.findMany).not.toHaveBeenCalled();
    expect(tx.space.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        discordUrl: null,
        logoBackground: 'color',
        logoZoom: 2,
        slug: 'quartier-central',
        managers: undefined,
        lastEditorId: 'manager-user',
      }),
    }));
  });

  it('transfers primary management after Discord confirmation', async () => {
    tx.space.findUnique.mockResolvedValue(createSpaceAccess());
    tx.user.findUnique.mockResolvedValue({
      role: 'user',
      discordUsername: 'next_manager',
    });
    tx.space.update.mockResolvedValue(createSpaceRecord({
      primaryManagerId: 'manager-user',
    }));

    await transferSpace(
      'quartier-central',
      actor,
      'manager-user',
      '@next_manager',
    );

    expect(tx.spaceManager.deleteMany).toHaveBeenCalledWith({
      where: {
        spaceId: 'space-1',
        userId: 'manager-user',
      },
    });
    expect(tx.spaceManager.upsert).toHaveBeenCalledWith(expect.objectContaining({
      create: {
        spaceId: 'space-1',
        userId: 'primary-user',
      },
    }));
    expect(tx.space.update).toHaveBeenCalledWith(expect.objectContaining({
      data: {
        primaryManagerId: 'manager-user',
        lastEditorId: 'primary-user',
      },
    }));
  });

  it('prevents a secondary manager from deleting a space', async () => {
    tx.space.findUnique.mockResolvedValue(createSpaceAccess());

    await expect(deleteSpace(
      'quartier-central',
      { userId: 'manager-user', role: 'user' },
    )).rejects.toMatchObject({ status: 403 });
    expect(tx.space.delete).not.toHaveBeenCalled();
  });
});

function createSpaceAccess() {
  return {
    id: 'space-1',
    primaryManagerId: 'primary-user',
    managers: [{ userId: 'manager-user' }],
  };
}

function createSpaceRecord(
  overrides: Partial<ReturnType<typeof createSpaceRecordBase>> = {},
) {
  return {
    ...createSpaceRecordBase(),
    ...overrides,
  };
}

function createSpaceRecordBase() {
  const primaryManager = {
    id: 'primary-user',
    discordDisplayName: 'Primary',
    discordUsername: 'primary',
    discordAvatarUrl: null,
    role: 'user',
    minecraftProfile: {
      uuid: 'member-b',
      name: 'Suki',
    },
  };
  return {
    id: 'space-1',
    slug: 'quartier-central',
    name: 'Quartier central',
    description: 'Centre commercial.',
    color: '#3B82F6',
    logoUrl: null,
    logoBackground: 'transparent' as const,
    logoZoom: 1.5,
    discordUrl: 'https://discord.gg/valnyfrost',
    primaryManagerId: 'primary-user',
    lastEditorId: 'primary-user',
    createdAt: new Date('2026-07-29T12:00:00.000Z'),
    updatedAt: new Date('2026-07-29T12:00:00.000Z'),
    primaryManager,
    lastEditor: primaryManager,
    managers: [{
      userId: 'manager-user',
      user: {
        id: 'manager-user',
        discordDisplayName: 'Manager',
        discordUsername: 'next_manager',
        discordAvatarUrl: null,
        role: 'user',
      },
    }],
    entries: [
      {
        id: 'entry-place',
        primaryManager,
        place: {
          _count: { tradeOffers: 2 },
          uid: 'place-1',
          slug: 'place-centrale',
          name: 'Place centrale',
          category: 'construction',
          images: [
            'https://example.com/place-1.png',
            'https://example.com/place-2.png',
          ],
          world: 'overworld',
        },
        portals: [],
        owners: [
          { profile: { uuid: 'member-a', name: 'Alex' } },
          { profile: { uuid: 'member-b', name: 'Suki' } },
        ],
      },
      {
        id: 'entry-portal',
        primaryManager: {
          ...primaryManager,
          minecraftProfile: null,
        },
        place: null,
        portals: [
          {
            slug: 'portail-central',
            name: 'Portail central',
            world: 'overworld',
          },
          {
            slug: 'portail-central',
            name: 'Portail central',
            world: 'nether',
          },
        ],
        owners: [
          { profile: { uuid: 'member-b', name: 'Suki' } },
        ],
      },
    ],
  };
}
