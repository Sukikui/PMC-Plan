'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { Place, Portal } from '@/lib/api/types';
import type { InteractiveMapPoint } from '@/components/map/core/map-types';
import { NETHER_MAP_WORLD, type MapWorld } from '@/lib/map/metadata';
import { DEFAULT_PLACE_CATEGORY, getMapIconSrc, isPlaceCategory } from '@/lib/place/categories';
import {
  indexLinkedPortalPairs,
  mergeLinkedPortalPair,
} from '@/lib/portal/linked-portals';
import { mapContentQueryOptions } from '@/lib/map-content/client';
import type { PlaceSummary, PortalSummary } from '@/lib/map-content/types';
import { resolveContentColor } from '@/lib/content/colors';

const EMPTY_PLACES: PlaceSummary[] = [];
const EMPTY_PORTALS: PortalSummary[] = [];

export type InteractiveMapDataPoint = InteractiveMapPoint & {
  item: Place | Portal | PlaceSummary | PortalSummary;
  itemType: 'place' | 'portal';
};

export function useWorldMapPoints(world: MapWorld) {
  const query = useQuery(mapContentQueryOptions);
  const places = query.data?.places ?? EMPTY_PLACES;
  const portals = query.data?.portals ?? EMPTY_PORTALS;

  const points = useMemo(
    () => buildWorldMapPoints(places, portals, world),
    [places, portals, world],
  );

  const pointById = useMemo(() => new Map(points.map((point) => [point.id, point])), [points]);

  return {
    loading: query.isPending,
    error: query.error?.message ?? null,
    points,
    pointById,
  };
}

export function buildWorldMapPoints(
  places: Array<Place | PlaceSummary>,
  portals: Array<Portal | PortalSummary>,
  world: MapWorld,
): InteractiveMapDataPoint[] {
  const placePoints = places
    .filter((place) => place.world === world)
    .map((place): InteractiveMapDataPoint => ({
      id: `place-${place.world}-${place.id}`,
      x: place.coordinates.x,
      z: place.coordinates.z,
      kind: 'place',
      label: place.name,
      iconSrc: getMapIconSrc(
        place.category && isPlaceCategory(place.category)
          ? place.category
          : DEFAULT_PLACE_CATEGORY,
      ),
      markerColor: resolveContentColor(place),
      previewImageSrc: 'previewImage' in place
        ? place.previewImage ?? undefined
        : place.images[0],
      spaceLogo: place.space ?? undefined,
      item: place,
      itemType: 'place',
    }));
  const linkedPairs = indexLinkedPortalPairs(portals);
  const portalPoints = portals
    .filter((portal) => portal.world === world)
    .map((portal): InteractiveMapDataPoint => {
      const pair = linkedPairs.get(portal.mapEntryId);
      const item = pair ? mergeLinkedPortalPair(pair) : portal;
      return {
        id: `portal-${portal.world}-${portal.mapEntryId}`,
        x: portal.coordinates.x,
        z: portal.coordinates.z,
        kind: portal.world === NETHER_MAP_WORLD
          ? 'portal-nether'
          : 'portal-overworld',
        label: item.name,
        iconSrc: getMapIconSrc('portail'),
        markerColor: resolveContentColor(item),
        previewImageSrc: 'previewImage' in item
          ? item.previewImage ?? undefined
          : item.images[0],
        spaceLogo: item.space ?? undefined,
        unidentified: item.unidentified,
        item,
        itemType: 'portal',
      };
    });

  return [...placePoints, ...portalPoints];
}
