'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  buildRouteFromParams,
  hasManualRouteCoordinates,
  type ManualRouteCoordinates,
  type PlayerRoutePosition,
  type RouteData,
} from '@/lib/route-planning';

interface UseRoutePlanParams {
  selectedId?: string;
  playerPosition?: PlayerRoutePosition | null;
  manualCoords?: ManualRouteCoordinates;
}

export function useRoutePlan({ selectedId, playerPosition, manualCoords }: UseRoutePlanParams) {
  const [route, setRoute] = useState<RouteData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const routeRef = useRef<RouteData | null>(null);

  useEffect(() => {
    routeRef.current = route;
  }, [route]);

  const shouldRecalculate = useCallback((currentRoute: RouteData | null) => {
    if (!currentRoute || currentRoute.steps.length === 0) {
      return true;
    }

    if (!playerPosition) {
      return true;
    }

    const currentFrom = currentRoute.player_from.coordinates;
    const distance = Math.sqrt(
      Math.pow(playerPosition.x - currentFrom.x, 2) +
      Math.pow(playerPosition.y - currentFrom.y, 2) +
      Math.pow(playerPosition.z - currentFrom.z, 2)
    );

    if (distance >= 5) {
      return true;
    }

    const lastStepTo = currentRoute.steps[currentRoute.steps.length - 1]?.to;
    return lastStepTo?.id !== selectedId;
  }, [playerPosition, selectedId]);

  const calculateRoute = useCallback(async (signal: AbortSignal) => {
    if (!selectedId) {
      return;
    }

    try {
      const fromParams = buildRouteFromParams(playerPosition, manualCoords);
      if (!fromParams) {
        return;
      }

      setLoading(true);
      setError(null);

      const response = await fetch(`/api/route?${fromParams}&to_place_id=${selectedId}`, { signal });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erreur ${response.status}: ${errorText || "Impossible de calculer l'itinéraire"}`);
      }

      const data: RouteData = await response.json();
      setRoute(data);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return;
      }

      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      setRoute(null);
    } finally {
      if (!signal.aborted) {
        setLoading(false);
      }
    }
  }, [manualCoords, playerPosition, selectedId]);

  useEffect(() => {
    const hasOrigin = Boolean(playerPosition || hasManualRouteCoordinates(manualCoords));
    if (!selectedId || !hasOrigin) {
      setRoute(null);
      setError(null);
      setLoading(false);
      return;
    }

    if (!shouldRecalculate(routeRef.current)) {
      return;
    }

    const controller = new AbortController();
    calculateRoute(controller.signal);
    return () => controller.abort();
  }, [calculateRoute, manualCoords, playerPosition, selectedId, shouldRecalculate]);

  return {
    route,
    loading,
    error,
    hasOrigin: Boolean(playerPosition || hasManualRouteCoordinates(manualCoords)),
  };
}
