'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Place, Portal } from '@/app/api/utils/shared';
import type { InteractiveMapPoint } from '@/components/map/core/map-types';
import { NETHER_MAP_WORLD, OVERWORLD_MAP_WORLD, type MapWorld } from '@/lib/map/metadata';
import { DEFAULT_PLACE_CATEGORY, getMapIconSrc, isPlaceCategory } from '@/lib/place/categories';
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

  const points = useMemo<InteractiveMapDataPoint[]>(() => {
    const placePoints = places
      .filter((place) => place.world === world)
      .map((place) => ({
        id: `place-${place.world}-${place.id}`,
        x: place.coordinates.x,
        z: place.coordinates.z,
        kind: 'place' as const,
        label: place.name,
        iconSrc: getMapIconSrc(
          place.category && isPlaceCategory(place.category)
            ? place.category
            : DEFAULT_PLACE_CATEGORY
        ),
        previewImageSrc: place.images[0],
        item: place,
        itemType: 'place' as const,
      }));

    const portalPoints = portals
      .filter((portal) => portal.world === world)
      .map((portal): InteractiveMapDataPoint => ({
        id: `portal-${portal.world}-${portal.id}`,
        x: portal.coordinates.x,
        z: portal.coordinates.z,
        kind: portal.world === NETHER_MAP_WORLD ? 'portal-nether' : 'portal-overworld',
        label: portal.name,
        iconSrc: getMapIconSrc('portail'),
        item: portal,
        itemType: 'portal' as const,
      }));

    return [...placePoints, ...portalPoints];
  }, [places, portals, world]);

  const pointById = useMemo(() => new Map(points.map((point) => [point.id, point])), [points]);

  return {
    loading,
    error,
    points,
    pointById,
  };
}

export function useOverworldMapPoints() {
  return useWorldMapPoints(OVERWORLD_MAP_WORLD);
}
