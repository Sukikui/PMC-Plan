import { prisma } from '@/lib/prisma';
import { GET } from '@/app/api/services/[slug]/route';
import { toService } from '@/lib/services/serialization';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    service: { findUnique: jest.fn() },
  },
}));

jest.mock('@/lib/services/serialization', () => ({
  serviceInclude: {},
  toService: jest.fn(),
}));

const mockedFindUnique = prisma.service.findUnique as jest.Mock;
const mockedToService = toService as jest.Mock;

describe('service detail API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns one serialized service', async () => {
    const record = { uid: 'service-1', slug: 'redstone' };
    const service = { id: 'redstone', name: 'Redstone' };
    mockedFindUnique.mockResolvedValue(record);
    mockedToService.mockReturnValue(service);

    const response = await GET(
      new Request('http://localhost/api/services/redstone') as never,
      { params: Promise.resolve({ slug: 'redstone' }) },
    );

    expect(response.status).toBe(200);
    expect(mockedFindUnique).toHaveBeenCalledWith({
      where: { slug: 'redstone' },
      include: {},
    });
    expect(await response.json()).toEqual({ service });
  });

  it('returns 404 for an unknown service', async () => {
    mockedFindUnique.mockResolvedValue(null);

    const response = await GET(
      new Request('http://localhost/api/services/missing') as never,
      { params: Promise.resolve({ slug: 'missing' }) },
    );

    expect(response.status).toBe(404);
  });
});
