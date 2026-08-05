'use client';

import type { QueryClient } from '@tanstack/react-query';
import type { Place, Portal } from '@/lib/api/types';
import { queryKeys } from '@/lib/query/keys';
import type { MapEntryManagement } from './types';

const MANAGEMENT_UPDATED_EVENT = 'pmc:map-entry-management-updated';

export function applyMapEntryManagementUpdate(
  queryClient: QueryClient,
  management: MapEntryManagement,
) {
  const patch = getMapEntryManagementPatch(management);
  (['place', 'portal'] as const).forEach((type) => {
    queryClient.setQueryData<Place | Portal>(
      queryKeys.mapEntryDetail(type, management.access.mapEntryId),
      (current) => current ? { ...current, ...patch } : current,
    );
  });
  notifyMapEntryManagementUpdate(management);
}

export function getMapEntryManagementPatch(
  management: MapEntryManagement,
) {
  return {
    owners: management.owners,
    lastEditor: management.lastEditor,
    primaryManagerId: management.access.primaryManagerId,
    managerIds: management.access.managerIds,
    primaryManager: management.primaryManager,
  };
}

export function subscribeToMapEntryManagementUpdates(
  listener: (management: MapEntryManagement) => void,
) {
  if (typeof window === 'undefined') return () => {};

  const handleUpdate = (event: Event) => {
    listener((event as CustomEvent<MapEntryManagement>).detail);
  };
  window.addEventListener(MANAGEMENT_UPDATED_EVENT, handleUpdate);
  return () => window.removeEventListener(MANAGEMENT_UPDATED_EVENT, handleUpdate);
}

function notifyMapEntryManagementUpdate(management: MapEntryManagement) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(
    MANAGEMENT_UPDATED_EVENT,
    { detail: management },
  ));
}
