import { preloadStartupResources } from '@/lib/preload/startup';
import { preloadOverworldMapImage } from '@/lib/map/image-preload';

jest.mock('@/lib/map/image-preload', () => ({
  preloadOverworldMapImage: jest.fn(),
}));

describe('startup preload', () => {
  it('only preloads the initial overworld map image', async () => {
    jest.mocked(preloadOverworldMapImage).mockResolvedValue();

    await preloadStartupResources();

    expect(preloadOverworldMapImage).toHaveBeenCalledTimes(1);
  });
});
