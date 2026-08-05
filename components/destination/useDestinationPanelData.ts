'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { mapContentQueryOptions } from '@/lib/map-content/client';
import type { PlaceSummary } from '@/lib/map-content/types';
import { indexLinkedPortalPairs, mergeLinkedPortalPair } from '@/lib/portal/linked-portals';
import type { DestinationListItem, TagFilterLogic } from './destination-panel-types';

const EMPTY_PLACES: PlaceSummary[] = [];

export function useDestinationPanelData(
  enabledTags: Set<string>,
  tagFilterLogic: TagFilterLogic,
  searchQuery: string
) {
  const dataQuery = useQuery(mapContentQueryOptions);
  const places = dataQuery.data?.places ?? EMPTY_PLACES;
  const portals = useMemo(() => {
    const rawPortals = dataQuery.data?.portals ?? [];
    const pairs = indexLinkedPortalPairs(rawPortals);
    return rawPortals.flatMap((portal) => {
      const pair = pairs.get(portal.mapEntryId);
      if (!pair) return [portal];
      return portal.world === 'overworld' ? [mergeLinkedPortalPair(pair)] : [];
    });
  }, [dataQuery.data?.portals]);

  const allTags = useMemo(() => Array.from(new Set(places.flatMap((place) => place.tags))), [places]);
  const query = searchQuery.toLowerCase();

  const filteredPlaces = useMemo(() => places.filter((place) => {
    const tagMatch = enabledTags.size === 0 || (
      tagFilterLogic === 'SINGLE' || tagFilterLogic === 'OR'
        ? place.tags.some((tag) => enabledTags.has(tag))
        : Array.from(enabledTags).every((enabledTag) => place.tags.includes(enabledTag))
    );

    const searchMatch = searchQuery === '' ||
      place.name.toLowerCase().includes(query) ||
      Boolean(place.description?.toLowerCase().includes(query)) ||
      Boolean(place.address?.toLowerCase().includes(query)) ||
      place.tags.some((tag) => tag.toLowerCase().includes(query)) ||
      place.world.toLowerCase().includes(query);

    return tagMatch && searchMatch;
  }), [enabledTags, places, query, searchQuery, tagFilterLogic]);

  const filteredPortals = useMemo(() => (
    enabledTags.size > 0
      ? []
      : portals.filter((portal) => searchQuery === '' ||
          portal.name.toLowerCase().includes(query) ||
          Boolean(portal.description?.toLowerCase().includes(query)) ||
          Boolean(portal.address?.toLowerCase().includes(query)) ||
          portal.world.toLowerCase().includes(query)
        )
  ), [enabledTags.size, portals, query, searchQuery]);

  const filteredDestinations = useMemo<DestinationListItem[]>(() => [
    ...filteredPlaces.map((place) => ({ id: place.id, type: 'place' as const, world: place.world })),
    ...filteredPortals.map((portal) => ({ id: portal.id, type: 'portal' as const, world: portal.world })),
  ], [filteredPlaces, filteredPortals]);

  return {
    allTags,
    filteredDestinations,
    filteredPlaces,
    filteredPortals,
    loading: dataQuery.isPending,
    places,
    portals,
  };
}
