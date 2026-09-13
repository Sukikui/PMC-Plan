import {
  loadPlaceByMapEntryId,
  loadPlaceBySlug,
  loadPortalByMapEntryId,
  loadPortalBySlug,
} from '@/app/api/utils/shared/loaders';
import {
  contentCacheTags,
  mapEntryDetailCacheTag,
} from '@/lib/content/cache-tags';
import { cacheDatabaseQuery } from '@/lib/cache/database-cache';
import type { Place, Portal } from '@/lib/api/types';

export function loadMapEntryDetail(
  type: 'place' | 'portal',
  mapEntryId: string,
) {
  return cacheDatabaseQuery(
    (): Promise<Place | Portal | null> => type === 'place'
      ? loadPlaceByMapEntryId(mapEntryId)
      : loadPortalByMapEntryId(mapEntryId),
    ['map-entry-detail-v1', type, mapEntryId],
    {
      revalidate: 300,
      tags: [
        contentCacheTags.mapDetails,
        mapEntryDetailCacheTag(mapEntryId),
      ],
    },
  )();
}

export function loadPlaceDetailBySlug(slug: string) {
  return cacheDatabaseQuery(
    () => loadPlaceBySlug(slug),
    ['place-detail-by-slug-v1', slug],
    {
      revalidate: 300,
      tags: [contentCacheTags.mapDetails],
    },
  )();
}

export function loadPortalDetailBySlug(slug: string) {
  return cacheDatabaseQuery(
    () => loadPortalBySlug(slug),
    ['portal-detail-by-slug-v1', slug],
    {
      revalidate: 300,
      tags: [contentCacheTags.mapDetails],
    },
  )();
}
