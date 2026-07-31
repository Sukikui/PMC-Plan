import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { POST as createPlace } from '@/app/api/places/route';
import { DELETE as deletePlace } from '@/app/api/places/[id]/route';
import { POST as createPortal } from '@/app/api/portals/route';
import { POST as createService } from '@/app/api/services/route';
import { DELETE as deleteService } from '@/app/api/services/[slug]/route';
import { prisma } from '@/lib/prisma';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    place: {
      create: jest.fn(),
      findUnique: jest.fn(),
    },
    portal: {
      create: jest.fn(),
    },
    service: {
      create: jest.fn(),
      findUnique: jest.fn(),
    },
    mapEntry: {
      delete: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

const mockedAuth = auth as jest.Mock;
const mockedPrisma = prisma as unknown as {
  place: { create: jest.Mock; findUnique: jest.Mock };
  portal: { create: jest.Mock };
  service: { create: jest.Mock; findUnique: jest.Mock };
  mapEntry: { delete: jest.Mock };
};

function createRequest(url: string) {
  return new NextRequest(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
}

describe('content mutation access', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedAuth.mockResolvedValue({
      user: { id: 'pending-user', role: 'pending' },
    });
  });

  it('prevents a pending user from creating a place', async () => {
    const response = await createPlace(
      createRequest('http://localhost/api/places'),
    );

    expect(response.status).toBe(403);
    expect(mockedPrisma.place.create).not.toHaveBeenCalled();
  });

  it('prevents a pending user from creating a portal', async () => {
    const response = await createPortal(
      createRequest('http://localhost/api/portals'),
    );

    expect(response.status).toBe(403);
    expect(mockedPrisma.portal.create).not.toHaveBeenCalled();
  });

  it('prevents a pending user from creating a service', async () => {
    const response = await createService(
      createRequest('http://localhost/api/services'),
    );

    expect(response.status).toBe(403);
    expect(mockedPrisma.service.create).not.toHaveBeenCalled();
  });

  it('prevents a secondary manager from deleting a place', async () => {
    mockedAuth.mockResolvedValue({
      user: { id: 'secondary-manager', role: 'user' },
    });
    mockedPrisma.place.findUnique.mockResolvedValue({
      uid: 'place-uid',
      mapEntryId: 'entry-1',
      mapEntry: { primaryManagerId: 'primary-manager' },
    });

    const response = await deletePlace(
      new NextRequest('http://localhost/api/places/place-id', {
        method: 'DELETE',
      }),
      { params: Promise.resolve({ id: 'place-id' }) },
    );

    expect(response.status).toBe(403);
    expect(mockedPrisma.mapEntry.delete).not.toHaveBeenCalled();
  });

  it('prevents a secondary manager from deleting a service', async () => {
    mockedAuth.mockResolvedValue({
      user: { id: 'secondary-manager', role: 'user' },
    });
    mockedPrisma.service.findUnique.mockResolvedValue({
      mapEntryId: 'entry-1',
      mapEntry: { primaryManagerId: 'primary-manager' },
    });

    const response = await deleteService(
      new NextRequest('http://localhost/api/services/redstone', {
        method: 'DELETE',
      }),
      { params: Promise.resolve({ slug: 'redstone' }) },
    );

    expect(response.status).toBe(403);
    expect(mockedPrisma.mapEntry.delete).not.toHaveBeenCalled();
  });
});
