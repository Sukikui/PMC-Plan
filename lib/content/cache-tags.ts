import { revalidateTag } from 'next/cache';

export const contentCacheTags = {
  map: 'public-map-content',
  mapDetails: 'public-map-entry-details',
  market: 'public-market-content',
  services: 'public-services',
  spaces: 'public-spaces',
  spaceDetails: 'public-space-details',
} as const;

export const mapEntryDetailCacheTag = (mapEntryId: string) => (
  `public-map-entry:${mapEntryId}`
);

export const spaceDetailCacheTag = (spaceId: string) => (
  `public-space:${spaceId}`
);

export const serviceDetailCacheTag = (slug: string) => (
  `public-service:${slug}`
);

function invalidateContentCache(tags: string[]) {
  new Set(tags).forEach((tag) => revalidateTag(tag));
}

export function invalidateMapEntryPublicData(
  type: 'place' | 'portal',
  mapEntryId: string,
) {
  invalidateContentCache([
    contentCacheTags.map,
    contentCacheTags.spaces,
    contentCacheTags.spaceDetails,
    mapEntryDetailCacheTag(mapEntryId),
    ...(type === 'place' ? [contentCacheTags.market] : []),
  ]);
}

export function invalidateSpacePublicData(slug: string) {
  invalidateContentCache([
    contentCacheTags.map,
    contentCacheTags.mapDetails,
    contentCacheTags.market,
    contentCacheTags.spaces,
    spaceDetailCacheTag(slug),
  ]);
}

export function invalidateAdministrativeTransferData({
  mapEntryIds,
  serviceSlugs,
  spaceSlugs,
}: {
  mapEntryIds: string[];
  serviceSlugs: string[];
  spaceSlugs: string[];
}) {
  invalidateContentCache([
    ...Object.values(contentCacheTags),
    ...mapEntryIds.map(mapEntryDetailCacheTag),
    ...serviceSlugs.map(serviceDetailCacheTag),
    ...spaceSlugs.map(spaceDetailCacheTag),
  ]);
}

export function invalidateServicePublicData(...slugs: string[]) {
  invalidateContentCache([
    contentCacheTags.services,
    ...slugs.map(serviceDetailCacheTag),
  ]);
}
