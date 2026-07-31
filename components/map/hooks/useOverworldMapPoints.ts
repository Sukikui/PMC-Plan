'use client';

import { useEffect, useMemo, useState } from 'react';
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
import {
  loadPlacesData,
  loadPortalsData,
  subscribeToMainScreenDataInvalidation,
} from '@/lib/preload/main-screen';

export type InteractiveMapDataPoint = InteractiveMapPoint & {
  item: Place | Portal;
  itemType: 'place' | 'portal';
};

export function useWorldMapPoints(world: MapWorld) {
  const [places, setPlaces] = useState<Place[]>([]);
  const [portals, setPortals] = useState<Portal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const [placesData, portalsData] = await Promise.all([
          loadPlacesData(),
          loadPortalsData(),
        ]);

        if (cancelled) {
          return;
        }

        setPlaces(placesData);
        setPortals(portalsData);
      } catch (err: unknown) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Erreur inattendue');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();
    const unsubscribe = subscribeToMainScreenDataInvalidation(load);

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  const points = useMemo(
    () => buildWorldMapPoints(places, portals, world),
    [places, portals, world],
  );

  const pointById = useMemo(() => new Map(points.map((point) => [point.id, point])), [points]);

  return {
    loading,
    error,
    points,
    pointById,
  };
}

export function buildWorldMapPoints(
  places: Place[],
  portals: Portal[],
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
      previewImageSrc: place.images[0],
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
