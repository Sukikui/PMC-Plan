import type { Place, Portal } from '@/lib/api/types';
import { createCachedList } from '@/lib/client/cached-list';
import type { MapEntryManagement } from '@/lib/map-entry/types';
import { mapMetadataByWorld } from '@/lib/map/metadata';

const MAIN_SCREEN_DATA_INVALIDATED_EVENT = 'pmc:main-screen-data-invalidated';
const MAP_ENTRY_MANAGEMENT_UPDATED_EVENT = 'pmc:map-entry-management-updated';

let overworldMapImageLoaded = false;
let overworldMapImagePromise: Promise<void> | null = null;

const fetchJson = async <T>(url: string, errorMessage: string): Promise<T> => {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(errorMessage);
  }

  return response.json();
};

const places = createCachedList<Place>({
  eventName: MAIN_SCREEN_DATA_INVALIDATED_EVENT,
  load: () => fetchJson('/api/places', 'Impossible de charger les lieux.'),
});
const portals = createCachedList<Portal>({
  eventName: MAIN_SCREEN_DATA_INVALIDATED_EVENT,
  load: () => fetchJson('/api/portals', 'Impossible de charger les portails.'),
});
const mergedPortals = createCachedList<Portal>({
  eventName: MAIN_SCREEN_DATA_INVALIDATED_EVENT,
  load: () => fetchJson(
    '/api/portals?merge-nether-portals=true',
    'Impossible de charger les portails.',
  ),
});

export const loadPlacesData = places.fetchAll;

export const loadPortalsData = ({ mergeNetherPortals = false } = {}) => {
  return (mergeNetherPortals ? mergedPortals : portals).fetchAll();
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
      image.src = mapMetadataByWorld.overworld.overview.image;
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
  places.invalidate({ notify: false });
  portals.invalidate({ notify: false });
  mergedPortals.invalidate({ notify: false });
  places.notify();
};

export const applyMapEntryManagementUpdate = (
  management: MapEntryManagement,
) => {
  places.update((records) => patchMapEntryRecords(records, management));
  portals.update((records) => patchMapEntryRecords(records, management));
  mergedPortals.update((records) => patchMapEntryRecords(records, management));

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(
      MAP_ENTRY_MANAGEMENT_UPDATED_EVENT,
      { detail: management },
    ));
  }
};

export const subscribeToMapEntryManagementUpdates = (
  listener: (management: MapEntryManagement) => void,
) => {
  if (typeof window === 'undefined') return () => {};

  const handleUpdate = (event: Event) => {
    listener((event as CustomEvent<MapEntryManagement>).detail);
  };
  window.addEventListener(MAP_ENTRY_MANAGEMENT_UPDATED_EVENT, handleUpdate);
  return () => {
    window.removeEventListener(MAP_ENTRY_MANAGEMENT_UPDATED_EVENT, handleUpdate);
  };
};

export const subscribeToMainScreenDataInvalidation = (listener: () => void) => {
  return places.subscribe(listener);
};

export const getMapEntryManagementPatch = (
  management: MapEntryManagement,
) => ({
  owners: management.owners,
  lastEditor: management.lastEditor,
  primaryManagerId: management.access.primaryManagerId,
  managerIds: management.access.managerIds,
  primaryManager: management.primaryManager,
});

function patchMapEntryRecords(
  records: Array<Place | Portal>,
  management: MapEntryManagement,
) {
  records.forEach((record) => {
    if (record.mapEntryId !== management.access.mapEntryId) return;
    Object.assign(record, getMapEntryManagementPatch(management));
  });
}
