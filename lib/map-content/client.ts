import { queryOptions } from '@tanstack/react-query';
import { requestJson } from '@/lib/api-client';
import type { Place, Portal } from '@/lib/api/types';
import { queryKeys } from '@/lib/query/keys';
import type { MapContentResponse } from './types';
import type { PlaceSummary, PortalSummary } from './types';
import { indexLinkedPortalPairs, mergeLinkedPortalPair } from '@/lib/portal/linked-portals';

export const mapContentQueryOptions = queryOptions({
  queryKey: queryKeys.mapContent,
  queryFn: ({ signal }) => requestJson<MapContentResponse>(
    '/api/map-content',
    { signal },
    'Impossible de charger les destinations.',
  ),
});

export function mapEntryDetailQueryOptions(
  type: 'place' | 'portal',
  mapEntryId: string,
) {
  return queryOptions({
    queryKey: queryKeys.mapEntryDetail(type, mapEntryId),
    queryFn: async ({ signal }) => {
      const payload = await requestJson<{ item: Place | Portal }>(
        `/api/map-entries/${encodeURIComponent(mapEntryId)}/detail?type=${type}`,
        { signal },
        'Impossible de charger ce contenu.',
      );
      return payload.item;
    },
  });
}

export function findMapEntrySummary(
  data: MapContentResponse,
  mapEntryId: string,
  type: 'place' | 'portal',
): PlaceSummary | PortalSummary | undefined {
  if (type === 'place') {
    return data.places.find((item) => item.mapEntryId === mapEntryId);
  }
  const portals = data.portals.filter((item) => item.mapEntryId === mapEntryId);
  const pair = indexLinkedPortalPairs(portals).get(mapEntryId);
  return pair
    ? mergeLinkedPortalPair(pair)
    : portals.find(({ world }) => world === 'overworld') ?? portals[0];
}
