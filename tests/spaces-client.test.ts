import { requestJson } from '@/lib/api-client';
import { invalidateMainScreenDataCaches } from '@/lib/preload/main-screen';
import {
  fetchSpace,
  subscribeToSpacesInvalidation,
  updateSpaceRequest,
} from '@/lib/spaces/client';

jest.mock('@/lib/api-client', () => ({
  requestJson: jest.fn(),
}));

jest.mock('@/lib/preload/main-screen', () => ({
  invalidateMainScreenDataCaches: jest.fn(),
}));

const requestJsonMock = requestJson as jest.Mock;
const invalidateMainScreenDataCachesMock =
  invalidateMainScreenDataCaches as jest.Mock;

describe('space client invalidation', () => {
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

  it('invalidates spaces and every map-entry view after an update', async () => {
    const listener = jest.fn();
    const unsubscribe = subscribeToSpacesInvalidation(listener);
    requestJsonMock.mockResolvedValue({
      space: {
        id: 'space-1',
        slug: 'valnyfrost',
        name: 'ValnyFrost',
      },
    });

    await updateSpaceRequest('valnyfrost', {
      name: 'ValnyFrost',
      slug: 'valnyfrost',
      color: '#1F2A65',
      managerIds: [],
    });

    expect(invalidateMainScreenDataCachesMock).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
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
