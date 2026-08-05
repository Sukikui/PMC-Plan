import { requestJson } from '@/lib/api-client';
import {
  fetchSpace,
  updateSpaceRequest,
} from '@/lib/spaces/client';

jest.mock('@/lib/api-client', () => ({
  requestJson: jest.fn(),
}));

const requestJsonMock = requestJson as jest.Mock;

describe('space client', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns the updated space without managing shared caches', async () => {
    const space = {
      id: 'space-1',
      slug: 'valnyfrost',
      name: 'ValnyFrost',
    };
    requestJsonMock.mockResolvedValue({ space });

    await expect(updateSpaceRequest('valnyfrost', {
      name: 'ValnyFrost',
      slug: 'valnyfrost',
      color: '#1F2A65',
      managerIds: [],
    })).resolves.toBe(space);

    expect(requestJsonMock).toHaveBeenCalledWith(
      '/api/spaces/valnyfrost',
      expect.objectContaining({ method: 'PUT' }),
      'Impossible d’enregistrer cet espace.',
    );
  });

  it('loads one space without invalidating shared lists', async () => {
    const space = {
      id: 'space-1',
      slug: 'valnyfrost',
      name: 'ValnyFrost',
    };
    requestJsonMock.mockResolvedValue({ space });

    await expect(fetchSpace('valnyfrost')).resolves.toBe(space);
    expect(requestJsonMock).toHaveBeenCalledWith(
      '/api/spaces/valnyfrost',
      { cache: 'no-store' },
      'Impossible de charger cet espace.',
    );
  });
});
