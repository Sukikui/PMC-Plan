import { unstable_cache } from 'next/cache';
import {
  contentCacheTags,
  spaceDetailCacheTag,
} from '@/lib/content/cache-tags';
import { getSpace } from './service';

export function loadSpaceDetail(slug: string) {
  return unstable_cache(
    () => getSpace(slug),
    ['space-detail-v1', slug],
    {
      revalidate: 300,
      tags: [contentCacheTags.spaceDetails, spaceDetailCacheTag(slug)],
    },
  )();
}
