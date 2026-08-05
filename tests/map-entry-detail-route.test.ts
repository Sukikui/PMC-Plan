import { NextRequest } from 'next/server';
import { GET } from '@/app/api/map-entries/[id]/detail/route';
import { loadMapEntryDetail } from '@/lib/map-content/detail-server';

jest.mock('@/lib/map-content/detail-server', () => ({
  loadMapEntryDetail: jest.fn(),
}));

const loadDetail = loadMapEntryDetail as jest.Mock;

describe('map-entry detail API', () => {
  beforeEach(() => jest.clearAllMocks());

  it('rejects an invalid content type before loading data', async () => {
    const response = await GET(
      new NextRequest('http://localhost/api/map-entries/entry/detail?type=space'),
      { params: Promise.resolve({ id: 'entry' }) },
    );

    expect(response.status).toBe(400);
    expect(loadDetail).not.toHaveBeenCalled();
  });

  it('returns one complete detail payload', async () => {
    const item = { id: 'marche', mapEntryId: 'entry' };
    loadDetail.mockResolvedValue(item);

    const response = await GET(
      new NextRequest('http://localhost/api/map-entries/entry/detail?type=place'),
      { params: Promise.resolve({ id: 'entry' }) },
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ item, type: 'place' });
  });
});
