import { GET } from '@/app/api/services/[slug]/route';
import { loadServiceDetail } from '@/lib/services/detail-server';

jest.mock('@/lib/services/detail-server', () => ({
  loadServiceDetail: jest.fn(),
}));

const mockedLoadService = loadServiceDetail as jest.Mock;

describe('service detail API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns one serialized service', async () => {
    const service = { id: 'redstone', name: 'Redstone' };
    mockedLoadService.mockResolvedValue(service);

    const response = await GET(
      new Request('http://localhost/api/services/redstone') as never,
      { params: Promise.resolve({ slug: 'redstone' }) },
    );

    expect(response.status).toBe(200);
    expect(mockedLoadService).toHaveBeenCalledWith('redstone');
    expect(await response.json()).toEqual({ service });
  });

  it('returns 404 for an unknown service', async () => {
    mockedLoadService.mockResolvedValue(null);

    const response = await GET(
      new Request('http://localhost/api/services/missing') as never,
      { params: Promise.resolve({ slug: 'missing' }) },
    );

    expect(response.status).toBe(404);
  });
});
