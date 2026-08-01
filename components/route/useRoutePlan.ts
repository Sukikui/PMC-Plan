'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  buildRouteFromParams,
  resolveRouteOrigin,
  shouldRefreshRouteOrigin,
  type ManualRouteCoordinates,
  type PlayerRoutePosition,
  type RouteData,
} from '@/lib/route-planning';

interface UseRoutePlanParams {
  selectedId?: string;
  playerPosition?: PlayerRoutePosition | null;
  manualCoords?: ManualRouteCoordinates;
}

interface LatestRouteOrigin {
  position: PlayerRoutePosition | null;
  synced: boolean;
}

export function useRoutePlan({ selectedId, playerPosition, manualCoords }: UseRoutePlanParams) {
  const [route, setRoute] = useState<RouteData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requestOrigin, setRequestOrigin] = useState<PlayerRoutePosition | null>(null);
  const inFlightRef = useRef(false);
  const requestIdRef = useRef(0);
  const selectedIdRef = useRef(selectedId);
  const latestOriginRef = useRef<LatestRouteOrigin>({ position: null, synced: false });
  selectedIdRef.current = selectedId;
  const manualWorld = manualCoords?.world;
  const manualX = manualCoords?.x;
  const manualY = manualCoords?.y;
  const manualZ = manualCoords?.z;
  const playerWorld = playerPosition?.world;
  const playerX = playerPosition?.x;
  const playerY = playerPosition?.y;
  const playerZ = playerPosition?.z;

  const latestOrigin = useMemo(
    () => resolveRouteOrigin(
      playerWorld !== undefined
        && playerX !== undefined
        && playerY !== undefined
        && playerZ !== undefined
        ? { world: playerWorld, x: playerX, y: playerY, z: playerZ }
        : null,
      manualWorld
        ? { world: manualWorld, x: manualX ?? '', y: manualY ?? '', z: manualZ ?? '' }
        : undefined,
    ),
    [
      manualWorld,
      manualX,
      manualY,
      manualZ,
      playerWorld,
      playerX,
      playerY,
      playerZ,
    ],
  );
  const isSynced = Boolean(playerPosition);

  useEffect(() => {
    const nextOrigin = { position: latestOrigin, synced: isSynced };
    latestOriginRef.current = nextOrigin;

    if (!selectedId || !latestOrigin) {
      setRequestOrigin(null);
      setRoute(null);
      setError(null);
      setLoading(false);
      return;
    }

    if (inFlightRef.current) return;
    setRequestOrigin((current) => (
      shouldRefreshRouteOrigin(current, nextOrigin.position, nextOrigin.synced)
        ? latestOrigin
        : current
    ));
  }, [isSynced, latestOrigin, selectedId]);

  useEffect(() => {
    if (!selectedId || !requestOrigin) return;

    const controller = new AbortController();
    const requestId = ++requestIdRef.current;
    inFlightRef.current = true;
    setLoading(true);
    setError(null);

    const calculateRoute = async () => {
      try {
        const fromParams = buildRouteFromParams(requestOrigin);
        const query = new URLSearchParams(fromParams ?? '');
        query.set('to_place_id', selectedId);
        const response = await fetch(`/api/route?${query}`, { signal: controller.signal });
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Erreur ${response.status}: ${errorText || "Impossible de calculer l'itinéraire"}`);
        }

        const data: RouteData = await response.json();
        if (requestId === requestIdRef.current) setRoute(data);
      } catch (err) {
        if (controller.signal.aborted) return;
        if (requestId === requestIdRef.current) {
          setError(err instanceof Error ? err.message : 'Erreur inconnue');
          setRoute(null);
        }
      } finally {
        if (!controller.signal.aborted && requestId === requestIdRef.current) {
          inFlightRef.current = false;
          setLoading(false);

          const latest = latestOriginRef.current;
          if (
            selectedIdRef.current === selectedId
            && shouldRefreshRouteOrigin(requestOrigin, latest.position, latest.synced)
          ) {
            setRequestOrigin(latest.position);
          }
        }
      }
    };

    void calculateRoute();
    return () => {
      controller.abort();
      inFlightRef.current = false;
    };
  }, [requestOrigin, selectedId]);

  return {
    route,
    loading,
    error,
    hasOrigin: Boolean(latestOrigin),
  };
}
