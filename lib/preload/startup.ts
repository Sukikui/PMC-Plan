import { fetchServices } from '@/lib/services/client';
import { fetchSpaces } from '@/lib/spaces/client';
import { preloadMainScreenResources } from './main-screen';
import { preloadOverlayModules } from './overlay-modules';

export const preloadStartupResources = async () => {
  await Promise.allSettled([
    preloadMainScreenResources(),
    preloadOverlayModules(),
    fetchServices(),
    fetchSpaces(),
  ]);
};
