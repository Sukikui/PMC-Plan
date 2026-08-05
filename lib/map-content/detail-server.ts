import { unstable_cache } from 'next/cache';
import {
  loadPlaceByMapEntryId,
  loadPortalByMapEntryId,
} from '@/app/api/utils/shared/loaders';
import {
  contentCacheTags,
  mapEntryDetailCacheTag,
} from '@/lib/content/cache-tags';

export function loadMapEntryDetail(
  type: 'place' | 'portal',
  mapEntryId: string,
) {
  return unstable_cache(
    () => type === 'place'
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
