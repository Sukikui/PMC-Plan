import { preloadOverworldMapImage } from '@/lib/map/image-preload';

export const preloadStartupResources = async () => {
  await Promise.allSettled([preloadOverworldMapImage()]);
};
