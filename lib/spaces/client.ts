import { requestJson } from '@/lib/api-client';
import { createCachedList } from '@/lib/client/cached-list';
import { invalidateMainScreenDataCaches } from '@/lib/preload/main-screen';
import type {
  Space,
  SpaceInput,
  SpaceUpdateInput,
} from './types';

interface SpaceResponse {
  error?: string;
  space: Space;
}

const SPACES_INVALIDATED_EVENT = 'pmc-plan:spaces-invalidated';
const spaces = createCachedList<Space>({
  eventName: SPACES_INVALIDATED_EVENT,
  load: async () => {
    const response = await fetch('/api/spaces', { cache: 'no-store' });
    const payload = await response.json() as {
      error?: string;
      spaces?: Space[];
    };
    if (!response.ok || !payload.spaces) {
      throw new Error(payload.error ?? 'Impossible de charger les espaces.');
    }
    return payload.spaces;
  },
});

export const fetchSpaces = spaces.fetchAll;

export async function createSpaceRequest(input: SpaceInput) {
  return sendSpaceRequest('/api/spaces', 'POST', input);
}

export async function updateSpaceRequest(
  slug: string,
  input: SpaceUpdateInput,
) {
  return sendSpaceRequest(
    `/api/spaces/${encodeURIComponent(slug)}`,
    'PUT',
    input,
  );
}

export async function transferSpaceRequest(
  slug: string,
  userId: string,
  confirmation: string,
) {
  return sendSpaceRequest(
    `/api/spaces/${encodeURIComponent(slug)}/transfer`,
    'POST',
    { userId, confirmation },
  );
}

export async function deleteSpaceRequest(slug: string) {
  await requestJson(`/api/spaces/${encodeURIComponent(slug)}`, {
    method: 'DELETE',
  }, 'Impossible de supprimer cet espace.');
  invalidateSpaceMutationCaches();
}

export function invalidateSpacesCache({
  notify = true,
}: {
  notify?: boolean;
} = {}) {
  spaces.invalidate({ notify });
}

export const subscribeToSpacesInvalidation = spaces.subscribe;

async function sendSpaceRequest(
  url: string,
  method: 'POST' | 'PUT',
  input: object,
) {
  const payload = await requestJson<SpaceResponse>(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  }, 'Impossible d’enregistrer cet espace.');
  if (!payload.space) {
    throw new Error(payload.error ?? 'Impossible d’enregistrer cet espace.');
  }
  invalidateSpaceMutationCaches();
  return payload.space;
}

function invalidateSpaceMutationCaches() {
  invalidateSpacesCache({ notify: false });
  invalidateMainScreenDataCaches();
  spaces.notify();
}
