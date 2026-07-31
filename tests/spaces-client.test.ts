import { requestJson } from '@/lib/api-client';
import { invalidateMainScreenDataCaches } from '@/lib/preload/main-screen';
import {
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
});
