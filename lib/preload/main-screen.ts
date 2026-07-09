import type { Place, Portal } from '@/app/api/utils/shared';
import { mapMetadataByWorld } from '@/lib/map/metadata';

interface MainScreenDataCache<T> {
  data: T | null;
  promise: Promise<T> | null;
}

const placesCache: MainScreenDataCache<Place[]> = {
  data: null,
  promise: null,
};

const portalsCache: MainScreenDataCache<Portal[]> = {
  data: null,
  promise: null,
};

const mergedPortalsCache: MainScreenDataCache<Portal[]> = {
  data: null,
  promise: null,
};

const MAIN_SCREEN_DATA_INVALIDATED_EVENT = 'pmc:main-screen-data-invalidated';

let overworldMapImageLoaded = false;
let overworldMapImagePromise: Promise<void> | null = null;

const fetchJson = async <T>(url: string, errorMessage: string): Promise<T> => {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(errorMessage);
  }

  return response.json();
};

const loadCached = <T>(
  cache: MainScreenDataCache<T>,
  loader: () => Promise<T>
): Promise<T> => {
  if (cache.data) {
    return Promise.resolve(cache.data);
  }

  if (!cache.promise) {
    cache.promise = loader()
      .then((data) => {
        cache.data = data;
        return data;
      })
      .catch((error) => {
        cache.promise = null;
        throw error;
      });
  }

  return cache.promise;
};

export const loadPlacesData = () =>
  loadCached(placesCache, () =>
    fetchJson<Place[]>('/api/places', 'Impossible de charger les lieux.')
  );

export const loadPortalsData = ({ mergeNetherPortals = false } = {}) => {
  const cache = mergeNetherPortals ? mergedPortalsCache : portalsCache;
  const url = mergeNetherPortals ? '/api/portals?merge-nether-portals=true' : '/api/portals';

  return loadCached(cache, () =>
    fetchJson<Portal[]>(url, 'Impossible de charger les portails.')
  );
};

export const preloadOverworldMapImage = () => {
  if (typeof window === 'undefined') {
    return Promise.resolve();
  }

  if (overworldMapImageLoaded) {
    return Promise.resolve();
  }

  if (!overworldMapImagePromise) {
    overworldMapImagePromise = new Promise<void>((resolve, reject) => {
      const image = new Image();
      image.onload = () => {
        overworldMapImageLoaded = true;
        resolve();
      };
      image.onerror = () => {
        overworldMapImagePromise = null;
        reject(new Error('Impossible de charger l’image de la carte.'));
      };
      image.src = mapMetadataByWorld.overworld.image;
    });
  }

  return overworldMapImagePromise;
};

export const preloadMainScreenResources = async () => {
  await Promise.allSettled([
    loadPlacesData(),
    loadPortalsData(),
    loadPortalsData({ mergeNetherPortals: true }),
    preloadOverworldMapImage(),
  ]);
};

export const invalidateMainScreenDataCaches = () => {
  placesCache.data = null;
  placesCache.promise = null;
  portalsCache.data = null;
  portalsCache.promise = null;
  mergedPortalsCache.data = null;
  mergedPortalsCache.promise = null;

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(MAIN_SCREEN_DATA_INVALIDATED_EVENT));
  }
};

export const subscribeToMainScreenDataInvalidation = (listener: () => void) => {
  if (typeof window === 'undefined') {
    return () => {};
  }

  window.addEventListener(MAIN_SCREEN_DATA_INVALIDATED_EVENT, listener);
  return () => {
    window.removeEventListener(MAIN_SCREEN_DATA_INVALIDATED_EVENT, listener);
  };
};
