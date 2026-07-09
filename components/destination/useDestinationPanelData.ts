'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Place, Portal } from '@/app/api/utils/shared';
import {
  loadPlacesData,
  loadPortalsData,
  subscribeToMainScreenDataInvalidation,
} from '@/lib/preload/main-screen';
import type { DestinationListItem, TagFilterLogic } from './destination-panel-types';

export function useDestinationPanelData(
  enabledTags: Set<string>,
  tagFilterLogic: TagFilterLogic,
  searchQuery: string
) {
  const [places, setPlaces] = useState<Place[]>([]);
  const [portals, setPortals] = useState<Portal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      try {
        setLoading(true);
        const [placesData, portalsData] = await Promise.all([
          loadPlacesData(),
          loadPortalsData({ mergeNetherPortals: true }),
        ]);

        if (!cancelled) {
          setPlaces(placesData);
          setPortals(portalsData);
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Network error loading data:', error);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadData();
    const unsubscribe = subscribeToMainScreenDataInvalidation(loadData);

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

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
    loading,
    places,
    portals,
  };
}

