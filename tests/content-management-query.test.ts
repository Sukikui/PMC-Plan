import { prisma } from '@/lib/prisma';
import { listContentManagement } from '@/lib/content-management/query';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    mapEntry: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    space: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

const mockedPrisma = prisma as unknown as {
  mapEntry: { count: jest.Mock; findMany: jest.Mock };
  space: { count: jest.Mock; findMany: jest.Mock };
  $transaction: jest.Mock;
};

describe('content management query', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedPrisma.mapEntry.findMany.mockResolvedValue([]);
    mockedPrisma.mapEntry.count.mockResolvedValue(0);
    mockedPrisma.space.findMany.mockResolvedValue([]);
    mockedPrisma.space.count.mockResolvedValue(0);
    mockedPrisma.$transaction.mockImplementation(
      (operations: Promise<unknown>[]) => Promise.all(operations),
    );
  });

  it('includes primary and secondary map-entry management', async () => {
    await listContentManagement({
      filter: 'all',
      managerId: 'user-1',
      page: 1,
      query: '',
      type: 'place',
    });

    expect(mockedPrisma.mapEntry.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          AND: expect.arrayContaining([managementFilter('user-1')]),
        },
      }),
    );
  });

  it('includes primary and secondary space management', async () => {
    await listContentManagement({
      filter: 'all',
      managerId: 'user-1',
      page: 1,
      query: '',
      type: 'space',
    });

    expect(mockedPrisma.space.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          AND: expect.arrayContaining([managementFilter('user-1')]),
        },
      }),
    );
  });

  it('searches only displayed map-entry text and Discord manager IDs', async () => {
    await listContentManagement({
      filter: 'all',
      page: 1,
      query: '@builder',
      type: 'place',
    });

    const where = mockedPrisma.mapEntry.findMany.mock.calls[0][0].where;
    expect(where.AND).toEqual(expect.arrayContaining([{
      OR: [
        { place: { is: { OR: [
          { name: searchText('@builder') },
          { slug: searchText('@builder') },
        ] } } },
        { space: { is: { name: searchText('@builder') } } },
        { primaryManager: { is: { name: searchText('@builder') } } },
        { primaryManager: { is: { username: searchText('builder') } } },
        { managers: { some: {
          user: { is: { username: searchText('builder') } },
        } } },
      ],
    }]));
  });

  it('filters services by contact without searching hidden service fields', async () => {
    await listContentManagement({
      filter: 'custom',
      page: 1,
      query: 'redstone',
      type: 'service',
    });

    const where = mockedPrisma.mapEntry.findMany.mock.calls[0][0].where;
    expect(where.AND[0]).toEqual({
      service: { is: { contactType: 'custom' } },
    });
    expect(where.AND[1].OR).toEqual([
      { service: { is: { OR: [
        { name: searchText('redstone') },
        { slug: searchText('redstone') },
      ] } } },
      { primaryManager: { is: { name: searchText('redstone') } } },
      { primaryManager: { is: { username: searchText('redstone') } } },
      { managers: { some: {
        user: { is: { username: searchText('redstone') } },
      } } },
    ]);
  });
});

function managementFilter(userId: string) {
  return {
    OR: [
      { primaryManagerId: userId },
      { managers: { some: { userId } } },
    ],
  };
}

function searchText(value: string) {
  return { contains: value, mode: 'insensitive' };
}
