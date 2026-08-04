import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { GET, PATCH } from '@/app/api/admin/settings/route';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    applicationSettings: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
  },
}));

const mockedAuth = auth as jest.Mock;
const mockedPrisma = prisma as unknown as {
  applicationSettings: {
    findUnique: jest.Mock;
    upsert: jest.Mock;
  };
};

describe('admin application settings API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedAuth.mockResolvedValue({
      user: { id: 'admin-1', role: 'admin' },
    });
  });

  it('returns the current approval setting', async () => {
    mockedPrisma.applicationSettings.findUnique.mockResolvedValue({
      automaticUserApproval: true,
    });

    const response = await GET(new NextRequest('http://localhost/api/admin/settings'));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      settings: { automaticUserApproval: true },
    });
  });

  it('updates the approval setting', async () => {
    mockedPrisma.applicationSettings.upsert.mockResolvedValue({
      automaticUserApproval: true,
    });
    const request = new NextRequest('http://localhost/api/admin/settings', {
      method: 'PATCH',
      body: JSON.stringify({ automaticUserApproval: true }),
    });

    const response = await PATCH(request);

    expect(response.status).toBe(200);
    expect(mockedPrisma.applicationSettings.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: { automaticUserApproval: true },
      }),
    );
  });

  it('rejects invalid settings', async () => {
    const request = new NextRequest('http://localhost/api/admin/settings', {
      method: 'PATCH',
      body: JSON.stringify({ automaticUserApproval: 'yes' }),
    });

    const response = await PATCH(request);

    expect(response.status).toBe(400);
    expect(mockedPrisma.applicationSettings.upsert).not.toHaveBeenCalled();
  });

  it('rejects settings access from User preview mode', async () => {
    const request = new NextRequest('http://localhost/api/admin/settings', {
      headers: {
        cookie: 'pmc-plan-admin-debug=true; pmc-plan-admin-mode=user',
      },
    });

    const response = await GET(request);

    expect(response.status).toBe(403);
    expect(mockedPrisma.applicationSettings.findUnique).not.toHaveBeenCalled();
  });
});
