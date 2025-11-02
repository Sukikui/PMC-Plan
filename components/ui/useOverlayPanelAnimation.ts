"use client";

import { useEffect, useRef, useState } from 'react';

interface OverlayAnimationOptions {
  closing?: boolean;
  delayMs?: number;
}

/**
 * Shared hook to handle enter/leave animations for overlay panels.
 * Returns a boolean indicating whether the panel should be in its "entered" state.
 * The animation uses requestAnimationFrame to ensure transforms are applied
 * after initial mount for smooth transitions.
 */
export function useOverlayPanelAnimation(isOpen: boolean, options: OverlayAnimationOptions = {}) {
  const { closing = false, delayMs = 10 } = options;
  const [entered, setEntered] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (isOpen && !closing) {
      // Delay the enter state so that initial styles apply before transition.
      if (delayMs > 0) {
        timeoutRef.current = setTimeout(() => {
          rafRef.current = requestAnimationFrame(() => setEntered(true));
        }, delayMs);
      } else {
        rafRef.current = requestAnimationFrame(() => setEntered(true));
      }
    } else {
      setEntered(false);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [isOpen, closing, delayMs]);

  return entered;
}
