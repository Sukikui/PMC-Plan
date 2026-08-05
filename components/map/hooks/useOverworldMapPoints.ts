'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { Place, Portal } from '@/lib/api/types';
import type {
  InteractiveMapPoint,
  MapTooltipSpaceLogo,
} from '@/components/map/core/map-types';
import { NETHER_MAP_WORLD, type MapWorld } from '@/lib/map/metadata';
import { DEFAULT_PLACE_CATEGORY, getMapIconSrc, isPlaceCategory } from '@/lib/place/categories';
import type { SpaceReference } from '@/lib/spaces/types';
import {
  indexLinkedPortalPairs,
  mergeLinkedPortalPair,
} from '@/lib/portal/linked-portals';
import { mapContentQueryOptions } from '@/lib/map-content/client';
import type { PlaceSummary, PortalSummary } from '@/lib/map-content/types';

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
      markerColor: place.space?.color,
      previewImageSrc: 'previewImage' in place
        ? place.previewImage ?? undefined
        : place.images[0],
      spaceLogo: toMapTooltipSpaceLogo(place.space),
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
        markerColor: item.space?.color,
        spaceLogo: toMapTooltipSpaceLogo(item.space),
        item,
        itemType: 'portal',
      };
    });

  return [...placePoints, ...portalPoints];
}

function toMapTooltipSpaceLogo(
  space: SpaceReference | null,
): MapTooltipSpaceLogo | undefined {
  if (!space) return undefined;

  return {
    color: space.color,
    logoBackground: space.logoBackground,
    logoSrc: space.logoUrl,
    logoZoom: space.logoZoom,
    name: space.name,
  };
}
