'use client';

import type { QueryClient } from '@tanstack/react-query';
import type { ContentManagementType } from '@/lib/content-management/types';
import { notifyContentUpdated } from '@/lib/content/client-events';
import { queryKeys } from './keys';

interface ContentInvalidation {
  mapEntryId?: string;
  nextSlug?: string;
  previousSlug?: string;
  type: ContentManagementType;
}

export function invalidateContentQueries(
  queryClient: QueryClient,
  mutation: ContentInvalidation,
) {
  const roots = getAffectedQueryRoots(mutation.type);
  roots.forEach((queryKey) => {
    void queryClient.invalidateQueries({ queryKey });
  });

  if (mutation.mapEntryId && isMapEntry(mutation.type)) {
    void queryClient.invalidateQueries({
      queryKey: queryKeys.mapEntryDetail(mutation.type, mutation.mapEntryId),
    });
  }

  if (mutation.previousSlug && mutation.previousSlug !== mutation.nextSlug) {
    queryClient.removeQueries({
      queryKey: getDetailKey(mutation.type, mutation.previousSlug),
    });
  }
  notifyContentUpdated(mutation.type);
}

export function invalidateManagementQueries(queryClient: QueryClient) {
  [
    ['market-offers'],
    ['service-detail'],
    ['service-list'],
    ['space-detail'],
    ['space-list'],
  ].forEach((queryKey) => {
    void queryClient.invalidateQueries({ queryKey });
  });
  notifyContentUpdated('all');
}

function getAffectedQueryRoots(type: ContentManagementType) {
  if (type === 'service') {
    return [['service-detail'], ['service-list']];
  }
  if (type === 'space') {
    return [
      queryKeys.mapContent,
      ['map-entry-detail'],
      ['market-offers'],
      ['space-detail'],
      ['space-list'],
      ['space-references'],
    ];
  }
  return [
    queryKeys.mapContent,
    ...(type === 'place' ? [['market-offers']] : []),
    ['space-detail'],
    ['space-list'],
  ];
}

function getDetailKey(type: ContentManagementType, slug: string) {
  return type === 'space'
    ? queryKeys.spaceDetail(slug)
    : queryKeys.serviceDetail(slug);
}

function isMapEntry(type: ContentManagementType): type is 'place' | 'portal' {
  return type === 'place' || type === 'portal';
}
