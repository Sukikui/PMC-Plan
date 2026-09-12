import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { DEFAULT_APP_PREFERENCES } from '@/lib/preferences';
import { GET, PUT } from '@/app/api/account/preferences/route';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      updateMany: jest.fn(),
    },
  },
}));

const mockedAuth = auth as jest.Mock;
const mockedPrisma = prisma as unknown as {
  user: {
    findUnique: jest.Mock;
    updateMany: jest.Mock;
  };
};

function updateRequest(preferences = DEFAULT_APP_PREFERENCES, initializeOnly = false) {
  return new NextRequest('http://localhost/api/account/preferences', {
    method: 'PUT',
    body: JSON.stringify({ preferences, initializeOnly }),
  });
}

describe('account preferences API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedAuth.mockResolvedValue({ user: { id: 'user-1', role: 'user' } });
  });

  it('returns null before account preferences are initialized', async () => {
    mockedPrisma.user.findUnique.mockResolvedValue({ preferences: null });

    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ preferences: null });
  });

  it('imports guest preferences only while the account field is null', async () => {
    mockedPrisma.user.updateMany.mockResolvedValue({ count: 1 });
    mockedPrisma.user.findUnique.mockResolvedValue({
      preferences: DEFAULT_APP_PREFERENCES,
    });

    const response = await PUT(updateRequest(DEFAULT_APP_PREFERENCES, true));

    expect(response.status).toBe(200);
    expect(mockedPrisma.user.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ id: 'user-1' }),
    }));
  });

  it('updates initialized account preferences', async () => {
    const preferences = { ...DEFAULT_APP_PREFERENCES, theme: 'dark' as const };
    mockedPrisma.user.updateMany.mockResolvedValue({ count: 1 });
    mockedPrisma.user.findUnique.mockResolvedValue({ preferences });

    const response = await PUT(updateRequest(preferences));

    expect(response.status).toBe(200);
    expect(mockedPrisma.user.updateMany).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { preferences },
    });
    await expect(response.json()).resolves.toEqual({ preferences });
  });

  it('rejects invalid or unauthenticated updates', async () => {
    const invalid = await PUT(updateRequest({ theme: 'dark' } as never));
    expect(invalid.status).toBe(400);

    mockedAuth.mockResolvedValue(null);
    const unauthorized = await PUT(updateRequest());
    expect(unauthorized.status).toBe(401);
  });
});
