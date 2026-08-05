import { getPagination } from '@/lib/api/pagination';
import { loadMapContentUncached } from '@/lib/map-content/server';
import { listMarketOffers } from '@/lib/market/server';
import { prisma } from '@/lib/prisma';
import { listServices } from '@/lib/services/list-server';
import { listSpaceSummaries } from '@/lib/spaces/summary-server';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    $transaction: jest.fn((queries: Array<Promise<unknown>>) => Promise.all(queries)),
    place: { findMany: jest.fn() },
    portal: { findMany: jest.fn() },
    service: { count: jest.fn(), findMany: jest.fn() },
    space: { count: jest.fn(), findMany: jest.fn() },
    tradeOffer: { count: jest.fn(), findMany: jest.fn() },
  },
}));

const placeFindMany = prisma.place.findMany as jest.Mock;
const portalFindMany = prisma.portal.findMany as jest.Mock;
const serviceCount = prisma.service.count as jest.Mock;
const serviceFindMany = prisma.service.findMany as jest.Mock;
const spaceCount = prisma.space.count as jest.Mock;
const spaceFindMany = prisma.space.findMany as jest.Mock;
const offerCount = prisma.tradeOffer.count as jest.Mock;
const offerFindMany = prisma.tradeOffer.findMany as jest.Mock;

describe('data-loading projections', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns lightweight map summaries from concurrent projections', async () => {
    placeFindMany.mockResolvedValue([{
      address: null,
      category: 'commerce',
      coordX: 12,
      coordY: 64,
      coordZ: -8,
      description: 'Marché local',
      images: ['preview.png', 'secondary.png'],
      mapEntry: { space: null },
      mapEntryId: 'entry-place',
      name: 'Marché',
      slug: 'marche',
      tags: ['commerce'],
      world: 'overworld',
    }]);
    portalFindMany.mockResolvedValue([]);

    await expect(loadMapContentUncached()).resolves.toEqual({
      places: [{
        address: null,
        category: 'commerce',
        coordinates: { x: 12, y: 64, z: -8 },
        description: 'Marché local',
        id: 'marche',
        mapEntryId: 'entry-place',
        name: 'Marché',
        previewImage: 'preview.png',
        space: null,
        tags: ['commerce'],
        world: 'overworld',
      }],
      portals: [],
    });
    expect(placeFindMany).toHaveBeenCalledWith(expect.objectContaining({
      select: expect.not.objectContaining({ tradeOffers: expect.anything() }),
    }));
  });

  it('clamps public page sizes and preserves the requested offset', async () => {
    expect(getPagination(new URLSearchParams('page=3&pageSize=500'))).toEqual({
      page: 3,
      pageSize: 50,
      skip: 100,
    });

    serviceFindMany.mockResolvedValue([]);
    serviceCount.mockResolvedValue(0);
    await listServices({
      contactType: null,
      page: 3,
      pageSize: 10,
      query: 'redstone',
    });
    expect(serviceFindMany).toHaveBeenCalledWith(expect.objectContaining({
      skip: 20,
      take: 10,
      where: expect.objectContaining({ OR: expect.any(Array) }),
    }));
  });

  it('paginates marketplace and space explorer queries on the server', async () => {
    offerFindMany.mockResolvedValue([]);
    offerCount.mockResolvedValue(0);
    spaceFindMany.mockResolvedValue([]);
    spaceCount.mockResolvedValue(0);

    await listMarketOffers({ page: 2, pageSize: 12, query: 'diamant' });
    await listSpaceSummaries({ page: 2, pageSize: 8, query: 'suki' });

    expect(offerFindMany).toHaveBeenCalledWith(expect.objectContaining({
      skip: 12,
      take: 12,
    }));
    expect(spaceFindMany).toHaveBeenCalledWith(expect.objectContaining({
      skip: 8,
      take: 8,
    }));
  });
});
