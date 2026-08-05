import {
  infiniteQueryOptions,
  keepPreviousData,
  queryOptions,
} from '@tanstack/react-query';
import { requestJson } from '@/lib/api-client';
import type { PaginatedResponse } from '@/lib/api/pagination';
import { queryKeys } from '@/lib/query/keys';
import type {
  ServiceInput,
  ServiceListItem,
  ServiceResponse,
} from './types';

export function serviceListQueryOptions(query: string, contact = 'all') {
  const contactParam = contact === 'all'
    ? ''
    : `&contact=${encodeURIComponent(contact)}`;
  return infiniteQueryOptions({
    queryKey: queryKeys.serviceList(query, contact),
    initialPageParam: 1,
    placeholderData: keepPreviousData,
    queryFn: ({ pageParam, signal }) => requestJson<PaginatedResponse<ServiceListItem>>(
      `/api/services?view=summary&page=${pageParam}&q=${encodeURIComponent(query)}${contactParam}`,
      { signal },
      'Impossible de charger les services.',
    ),
    getNextPageParam: (lastPage) => (
      lastPage.pagination.page < lastPage.pagination.totalPages
        ? lastPage.pagination.page + 1
        : undefined
    ),
  });
}

export async function fetchService(slug: string) {
  const payload = await requestJson<ServiceResponse>(
    `/api/services/${encodeURIComponent(slug)}`,
    { cache: 'no-store' },
    'Impossible de charger ce service.',
  );
  return payload.service;
}

export function serviceDetailQueryOptions(slug: string) {
  return queryOptions({
    queryKey: queryKeys.serviceDetail(slug),
    queryFn: () => fetchService(slug),
  });
}

export async function createServiceRequest(input: ServiceInput) {
  return sendServiceRequest('/api/services', 'POST', input);
}

export async function updateServiceRequest(
  slug: string,
  input: ServiceInput,
) {
  return sendServiceRequest(
    `/api/services/${encodeURIComponent(slug)}`,
    'PUT',
    input,
  );
}

export async function deleteServiceRequest(slug: string) {
  await requestJson(
    `/api/services/${encodeURIComponent(slug)}`,
    { method: 'DELETE' },
    'Impossible de supprimer ce service.',
  );
}

async function sendServiceRequest(
  url: string,
  method: 'POST' | 'PUT',
  input: ServiceInput,
) {
  const payload = await requestJson<ServiceResponse>(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  }, 'Impossible d’enregistrer ce service.');
  return payload.service;
}
