import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  MAP_ICON_TO_POINT_DURATION_MS,
  MAP_REVEAL_END_BUFFER_MS,
  MAP_REVEAL_MAX_DELAY_MS,
} from '../core/map-constants';
import type { PointRenderMode } from '../core/map-types';

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
