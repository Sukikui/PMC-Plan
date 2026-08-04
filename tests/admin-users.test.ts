import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { GET } from '@/app/api/admin/users/route';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

const mockedPrisma = prisma as unknown as {
  user: {
    findMany: jest.Mock;
    count: jest.Mock;
  };
  $transaction: jest.Mock;
};
const mockedAuth = auth as jest.Mock;

describe('admin users API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedAuth.mockResolvedValue({
      user: { id: 'test-user', role: 'admin' },
    });
    mockedPrisma.user.findMany.mockResolvedValue([
      {
        id: 'user-1',
        discordDisplayName: 'Suki',
        discordUsername: 'suki',
        discordAvatarUrl: null,
        role: 'user',
        minecraftProfile: {
          uuid: 'minecraft-uuid',
          name: '_Suki_',
          linkedAt: new Date('2026-07-01T12:00:00.000Z'),
        },
        createdAt: new Date('2026-06-01T12:00:00.000Z'),
      },
    ]);
    mockedPrisma.user.count.mockResolvedValue(21);
    mockedPrisma.$transaction.mockImplementation((operations: Promise<unknown>[]) =>
      Promise.all(operations)
    );
  });

  it('returns paginated user summaries', async () => {
    const response = await GET(new NextRequest('http://localhost/api/admin/users?page=2'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(mockedPrisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 7, take: 7 })
    );
    expect(body.pagination).toEqual({
      page: 2,
      pageSize: 7,
      total: 21,
      totalPages: 3,
    });
    expect(body.users[0]).toEqual(
      expect.objectContaining({
        minecraftName: '_Suki_',
        minecraftLinkedAt: '2026-07-01T12:00:00.000Z',
      })
    );
  });

  it('applies search and role filters', async () => {
    await GET(new NextRequest(
      'http://localhost/api/admin/users?query=suki&role=administrators'
    ));

    expect(mockedPrisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.any(Array),
          role: { in: ['admin', 'super_admin'] },
        }),
      })
    );
  });

  it('searches displayed identities and normalizes Discord usernames', async () => {
    await GET(new NextRequest(
      'http://localhost/api/admin/users?query=%40suki',
    ));

    const where = mockedPrisma.user.findMany.mock.calls[0][0].where;
    expect(where.OR).toEqual(expect.arrayContaining([
      { id: { contains: '@suki', mode: 'insensitive' } },
      { discordUsername: { contains: 'suki', mode: 'insensitive' } },
    ]));
  });

  it('searches the displayed unlinked Minecraft state', async () => {
    await GET(new NextRequest(
      'http://localhost/api/admin/users?query=non%20lie',
    ));

    const where = mockedPrisma.user.findMany.mock.calls[0][0].where;
    expect(where.OR).toContainEqual({ minecraftProfile: { is: null } });
  });

  it('filters users awaiting approval', async () => {
    await GET(new NextRequest(
      'http://localhost/api/admin/users?role=pending'
    ));

    expect(mockedPrisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          role: 'pending',
        }),
      })
    );
  });

  it('allows super admins to read the user list', async () => {
    mockedAuth.mockResolvedValue({
      user: { id: 'super-admin-1', role: 'super_admin' },
    });

    const response = await GET(new NextRequest('http://localhost/api/admin/users'));

    expect(response.status).toBe(200);
  });

  it('removes administration access while previewing User mode', async () => {
    const response = await GET(new NextRequest(
      'http://localhost/api/admin/users',
      {
        headers: {
          cookie: [
            'pmc-plan-admin-debug=true',
            'pmc-plan-admin-mode=user',
          ].join('; '),
        },
      },
    ));

    expect(response.status).toBe(403);
    expect(mockedPrisma.user.findMany).not.toHaveBeenCalled();
  });
});
