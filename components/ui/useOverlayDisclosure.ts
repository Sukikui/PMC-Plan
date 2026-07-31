'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { OVERLAY_TRANSITION_MS } from '@/lib/ui/overlay';

export function useOverlayDisclosure() {
  const [state, setState] = useState({ isOpen: false, isClosing: false });
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearCloseTimeout = useCallback(() => {
    if (!timeoutRef.current) return;
    clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
  }, []);

  const open = useCallback(() => {
    clearCloseTimeout();
    setState({ isOpen: true, isClosing: false });
  }, [clearCloseTimeout]);

  const close = useCallback(() => {
    setState((current) => {
      if (!current.isOpen || current.isClosing) return current;
      return { ...current, isClosing: true };
    });
    clearCloseTimeout();
    timeoutRef.current = setTimeout(() => {
      timeoutRef.current = null;
      setState({ isOpen: false, isClosing: false });
    }, OVERLAY_TRANSITION_MS);
  }, [clearCloseTimeout]);

  useEffect(() => clearCloseTimeout, [clearCloseTimeout]);

  return { ...state, open, close };
}
