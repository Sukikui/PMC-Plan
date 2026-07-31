import { useEffect, useRef } from 'react';
import type {
  MapCoordinate,
  MapMetadata,
} from '@/lib/map/metadata';
import { getMapSafeArea, getVisibleMapPanelRects } from '../core/map-panels';
import { getRouteView } from '../core/map-route-view';
import type { MapPan, MapSize, MapViewport } from '../core/map-view';

interface UseMapRouteFocusParams {
  focusKey?: string;
  points: MapCoordinate[];
  isBlocked: boolean;
  metadata: MapMetadata;
  viewport: MapViewport;
  baseSize: MapSize;
  maxZoom: number;
  clampPan: (pan: MapPan, zoom: number) => MapPan;
  animateView: (zoom: number, pan: MapPan, onComplete?: () => void) => void;
  clearPointTooltip: () => void;
  onFocusComplete: () => void;
}

export const useMapRouteFocus = ({
  focusKey,
  points,
  isBlocked,
  metadata,
  viewport,
  baseSize,
  maxZoom,
  clampPan,
  animateView,
  clearPointTooltip,
  onFocusComplete,
}: UseMapRouteFocusParams) => {
  const framedKeyRef = useRef<string | undefined>(undefined);
  const activeFocusKeyRef = useRef(focusKey);
  const onFocusCompleteRef = useRef(onFocusComplete);

  useEffect(() => {
    activeFocusKeyRef.current = focusKey;
    onFocusCompleteRef.current = onFocusComplete;
  }, [focusKey, onFocusComplete]);

  useEffect(() => {
    if (!focusKey) {
      framedKeyRef.current = undefined;
      return;
    }

    if (
      framedKeyRef.current === focusKey ||
      isBlocked ||
      !viewport.width ||
      !viewport.height
    ) {
      return;
    }

    const nextView = getRouteView({
      points,
      metadata,
      viewport,
      baseSize,
      safeArea: getMapSafeArea(viewport, getVisibleMapPanelRects()),
      maxZoom,
      clampPan,
    });
    if (!nextView) return;

    framedKeyRef.current = focusKey;
    clearPointTooltip();
    animateView(nextView.zoom, nextView.pan, () => {
      if (activeFocusKeyRef.current === focusKey) {
        onFocusCompleteRef.current();
      }
    });
  }, [
    animateView,
    baseSize,
    clampPan,
    clearPointTooltip,
    focusKey,
    isBlocked,
    maxZoom,
    metadata,
    points,
    viewport,
  ]);
};
