import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { PATCH } from '@/app/api/admin/users/[id]/role/route';
import { prisma } from '@/lib/prisma';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

const mockedAuth = auth as jest.Mock;
const mockedPrisma = prisma as unknown as {
  user: {
    findUnique: jest.Mock;
    update: jest.Mock;
  };
};

function createRequest(role: string) {
  return new NextRequest('http://localhost/api/admin/users/user-1/role', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role }),
  });
}

const context = {
  params: Promise.resolve({ id: 'user-1' }),
};

describe('admin user role API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedAuth.mockResolvedValue({
      user: { id: 'super-admin-1', role: 'super_admin' },
    });
    mockedPrisma.user.findUnique.mockResolvedValue({ role: 'user' });
    mockedPrisma.user.update.mockResolvedValue({
      id: 'user-1',
      role: 'admin',
    });
  });

  it('allows a super admin to assign the admin role', async () => {
    const response = await PATCH(createRequest('admin'), context);

    expect(response.status).toBe(200);
    expect(mockedPrisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { role: 'admin' },
      select: { id: true, role: true },
    });
    await expect(response.json()).resolves.toEqual({
      user: { id: 'user-1', role: 'admin' },
    });
  });

  it('allows an admin to approve a pending user', async () => {
    mockedAuth.mockResolvedValue({
      user: { id: 'admin-1', role: 'admin' },
    });
    mockedPrisma.user.findUnique.mockResolvedValue({ role: 'pending' });
    mockedPrisma.user.update.mockResolvedValue({
      id: 'user-1',
      role: 'user',
    });

    const response = await PATCH(createRequest('user'), context);

    expect(response.status).toBe(200);
    expect(mockedPrisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { role: 'user' },
      select: { id: true, role: true },
    });
  });

  it('prevents an admin from promoting another user', async () => {
    mockedAuth.mockResolvedValue({
      user: { id: 'admin-1', role: 'admin' },
    });

    const response = await PATCH(createRequest('admin'), context);

    expect(response.status).toBe(403);
    expect(mockedPrisma.user.update).not.toHaveBeenCalled();
  });

  it('does not modify a super admin from the application', async () => {
    mockedPrisma.user.findUnique.mockResolvedValue({
      role: 'super_admin',
    });

    const response = await PATCH(createRequest('user'), context);

    expect(response.status).toBe(403);
    expect(mockedPrisma.user.update).not.toHaveBeenCalled();
  });

  it('rejects unsupported roles', async () => {
    const response = await PATCH(createRequest('super_admin'), context);

    expect(response.status).toBe(400);
    expect(mockedPrisma.user.findUnique).not.toHaveBeenCalled();
  });

  it('rejects role changes from pending users', async () => {
    mockedAuth.mockResolvedValue({
      user: { id: 'pending-1', role: 'pending' },
    });

    const response = await PATCH(createRequest('user'), context);

    expect(response.status).toBe(403);
    expect(mockedPrisma.user.findUnique).not.toHaveBeenCalled();
  });
});
