import { preloadMainScreenResources } from '@/lib/preload/main-screen';
import { preloadStartupResources } from '@/lib/preload/startup';
import { preloadOverlayModules } from '@/lib/preload/overlay-modules';
import { fetchServices } from '@/lib/services/client';
import { fetchSpaces } from '@/lib/spaces/client';

jest.mock('@/lib/preload/main-screen', () => ({
  preloadMainScreenResources: jest.fn(),
}));
jest.mock('@/lib/preload/overlay-modules', () => ({
  preloadOverlayModules: jest.fn(),
}));
jest.mock('@/lib/services/client', () => ({
  fetchServices: jest.fn(),
}));
jest.mock('@/lib/spaces/client', () => ({
  fetchSpaces: jest.fn(),
}));

describe('startup preload', () => {
  it('loads core data and deferred overlays together', async () => {
    jest.mocked(preloadMainScreenResources).mockResolvedValue();
    jest.mocked(preloadOverlayModules).mockResolvedValue();
    jest.mocked(fetchServices).mockResolvedValue([]);
    jest.mocked(fetchSpaces).mockResolvedValue([]);

    await preloadStartupResources();

    expect(preloadMainScreenResources).toHaveBeenCalledTimes(1);
    expect(preloadOverlayModules).toHaveBeenCalledTimes(1);
    expect(fetchServices).toHaveBeenCalledTimes(1);
    expect(fetchSpaces).toHaveBeenCalledTimes(1);
  });
});
