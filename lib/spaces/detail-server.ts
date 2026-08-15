import {
  contentCacheTags,
  spaceDetailCacheTag,
} from '@/lib/content/cache-tags';
import { cacheDatabaseQuery } from '@/lib/cache/database-cache';
import { getSpace } from './service';

export function loadSpaceDetail(slug: string) {
  return cacheDatabaseQuery(
    () => getSpace(slug),
    ['space-detail-v1', slug],
    {
      revalidate: 300,
      tags: [contentCacheTags.spaceDetails, spaceDetailCacheTag(slug)],
    },
  )();
}
