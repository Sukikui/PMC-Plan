import { requestJson } from '@/lib/api-client';
import {
  fetchService,
  updateServiceRequest,
} from '@/lib/services/client';

jest.mock('@/lib/api-client', () => ({
  requestJson: jest.fn(),
}));

const requestJsonMock = requestJson as jest.Mock;

describe('service client', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns the updated service without managing shared caches', async () => {
    const service = {
      id: 'redstone',
      slug: 'redstone',
      name: 'Redstone',
    };
    requestJsonMock.mockResolvedValue({ service });

    await expect(updateServiceRequest('redstone', {
      name: 'Redstone',
      subtitle: 'Création de systèmes redstone',
      slug: 'redstone',
      description: 'Systèmes sur mesure.',
      contactType: 'none',
    })).resolves.toBe(service);

    expect(requestJsonMock).toHaveBeenCalledWith(
      '/api/services/redstone',
      expect.objectContaining({ method: 'PUT' }),
      'Impossible d’enregistrer ce service.',
    );
  });

  it('loads one service without invalidating shared lists', async () => {
    const service = {
      id: 'redstone',
      slug: 'redstone',
      name: 'Redstone',
    };
    requestJsonMock.mockResolvedValue({ service });

    await expect(fetchService('redstone')).resolves.toBe(service);
    expect(requestJsonMock).toHaveBeenCalledWith(
      '/api/services/redstone',
      { cache: 'no-store' },
      'Impossible de charger ce service.',
    );
  });
});
