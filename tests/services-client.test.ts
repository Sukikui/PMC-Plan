import { requestJson } from '@/lib/api-client';
import {
  fetchService,
  subscribeToServicesInvalidation,
  updateServiceRequest,
} from '@/lib/services/client';

jest.mock('@/lib/api-client', () => ({
  requestJson: jest.fn(),
}));

const requestJsonMock = requestJson as jest.Mock;

describe('service client invalidation', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: new EventTarget(),
    });
  });

  afterEach(() => {
    Reflect.deleteProperty(globalThis, 'window');
  });

  it('notifies every service view after an update', async () => {
    const listener = jest.fn();
    const unsubscribe = subscribeToServicesInvalidation(listener);
    requestJsonMock.mockResolvedValue({
      service: {
        id: 'redstone',
        slug: 'redstone',
        name: 'Redstone',
      },
    });

    await updateServiceRequest('redstone', {
      name: 'Redstone',
      subtitle: 'Création de systèmes redstone',
      slug: 'redstone',
      description: 'Systèmes sur mesure.',
      contactType: 'none',
    });

    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
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
