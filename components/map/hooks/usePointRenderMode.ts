import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  MAP_ICON_TO_POINT_DURATION_MS,
  MAP_REVEAL_END_BUFFER_MS,
  MAP_REVEAL_MAX_DELAY_MS,
} from '../core/map-constants';
import type { PointRenderMode } from '../core/map-types';

interface ViewportIconState {
  pointIds: ReadonlySet<string>;
  zoom: number;
  resetKey: string;
}

interface ViewportIconUpdate {
  visiblePointIds: ReadonlySet<string>;
  zoom: number;
  zoomDirection: 'in' | 'out' | null;
  showPointIcons: boolean;
  pointRenderMode: PointRenderMode;
  resetKey: string;
}

export const usePointRenderMode = (showPointIcons: boolean, resetKey: string) => {
  const [pointRenderMode, setPointRenderMode] = useState<PointRenderMode>(
    showPointIcons ? 'icons' : 'points'
  );
  const [animatePointTransitions, setAnimatePointTransitions] = useState(true);
  const previousShowPointIconsRef = useRef(showPointIcons);
  const previousResetKeyRef = useRef(resetKey);
  const skipNextTransitionRef = useRef(false);
  const iconExitTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useLayoutEffect(() => {
    if (iconExitTimeoutRef.current) {
      clearTimeout(iconExitTimeoutRef.current);
      iconExitTimeoutRef.current = null;
    }

    if (previousResetKeyRef.current !== resetKey) {
      previousResetKeyRef.current = resetKey;
      previousShowPointIconsRef.current = showPointIcons;
      skipNextTransitionRef.current = true;
      setAnimatePointTransitions(false);
      setPointRenderMode(showPointIcons ? 'icons' : 'points');
      return;
    }

    if (skipNextTransitionRef.current) {
      previousShowPointIconsRef.current = showPointIcons;
      skipNextTransitionRef.current = false;
      setAnimatePointTransitions(false);
      setPointRenderMode(showPointIcons ? 'icons' : 'points');
      return;
    }

    const wasShowingPointIcons = previousShowPointIconsRef.current;
    previousShowPointIconsRef.current = showPointIcons;
    setAnimatePointTransitions(true);

    if (showPointIcons) {
      setPointRenderMode('icons');
      return;
    }

    if (wasShowingPointIcons) {
      setPointRenderMode('icons-to-points');
      iconExitTimeoutRef.current = setTimeout(() => {
        iconExitTimeoutRef.current = null;
        setPointRenderMode('points');
      }, MAP_REVEAL_MAX_DELAY_MS + MAP_ICON_TO_POINT_DURATION_MS + MAP_REVEAL_END_BUFFER_MS);
      return;
    }

    setPointRenderMode('points');
  }, [resetKey, showPointIcons]);

  useEffect(() => () => {
    if (iconExitTimeoutRef.current) {
      clearTimeout(iconExitTimeoutRef.current);
    }
  }, []);

  return {
    pointRenderMode,
    animatePointTransitions,
  };
};

export const useViewportPointIcons = (update: ViewportIconUpdate) => {
  const stateRef = useRef<ViewportIconState>({
    pointIds: update.showPointIcons ? update.visiblePointIds : new Set(),
    zoom: update.zoom,
    resetKey: update.resetKey,
  });

  stateRef.current = getNextViewportIconState(stateRef.current, update);
  return stateRef.current.pointIds;
};

export const getNextViewportIconState = (
  previous: ViewportIconState,
  update: ViewportIconUpdate
): ViewportIconState => {
  const reset = previous.resetKey !== update.resetKey;
  const isZoomingOut = !reset && (
    update.zoomDirection === 'out' || update.zoom < previous.zoom
  );
  let pointIds = previous.pointIds;

  if (reset) {
    pointIds = update.showPointIcons ? update.visiblePointIds : new Set();
  } else if (update.showPointIcons && !isZoomingOut) {
    pointIds = update.visiblePointIds;
  } else if (update.pointRenderMode === 'points') {
    pointIds = new Set();
  }

  return { pointIds, zoom: update.zoom, resetKey: update.resetKey };
};
