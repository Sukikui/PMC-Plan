import {
  infiniteQueryOptions,
  keepPreviousData,
  queryOptions,
} from '@tanstack/react-query';
import { requestJson } from '@/lib/api-client';
import type { PaginatedResponse } from '@/lib/api/pagination';
import { queryKeys } from '@/lib/query/keys';
import type {
  Space,
  SpaceInput,
  SpaceReference,
  SpaceSummary,
  SpaceUpdateInput,
} from './types';

interface SpaceResponse {
  error?: string;
  space: Space;
}

export async function fetchSpace(slug: string) {
  const payload = await requestJson<SpaceResponse>(
    `/api/spaces/${encodeURIComponent(slug)}`,
    { cache: 'no-store' },
    'Impossible de charger cet espace.',
  );
  return payload.space;
}

export function spaceDetailQueryOptions(slug: string) {
  return queryOptions({
    queryKey: queryKeys.spaceDetail(slug),
    queryFn: () => fetchSpace(slug),
  });
}

export function spaceReferencesQueryOptions(role?: string) {
  return queryOptions({
    queryKey: queryKeys.spaceReferences(role),
    queryFn: async () => {
      const payload = await requestJson<{ spaces: SpaceReference[] }>(
        '/api/spaces?view=reference',
        {},
        'Impossible de charger les espaces.',
      );
      return payload.spaces;
    },
  });
}

export function spaceSummariesQueryOptions(query: string) {
  return infiniteQueryOptions({
    queryKey: queryKeys.spaceList(query),
    initialPageParam: 1,
    placeholderData: keepPreviousData,
    queryFn: ({ pageParam, signal }) => requestJson<PaginatedResponse<SpaceSummary>>(
      `/api/spaces?view=summary&page=${pageParam}&q=${encodeURIComponent(query)}`,
      { signal },
      'Impossible de charger les espaces.',
    ),
    getNextPageParam: (lastPage) => (
      lastPage.pagination.page < lastPage.pagination.totalPages
        ? lastPage.pagination.page + 1
        : undefined
    ),
  });
}

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
}

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
  return payload.space;
}
