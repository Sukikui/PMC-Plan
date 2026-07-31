'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { themeColors } from '@/lib/theme-colors';
import {
  bringOverlayLayerToFront,
  OVERLAY_BASE_Z_INDEX,
  OVERLAY_LAYER_ENTRY_DELAY_MS,
  OVERLAY_TRANSITION_MS,
  removeOverlayLayer,
} from '@/lib/ui/overlay';

interface OverlayStackContextValue {
  layers: string[];
  revealedLayerId: string | null;
  beginClose: (layerId: string) => void;
  register: (layerId: string, onClose: () => void) => void;
  unregister: (layerId: string) => void;
}

const OverlayStackContext = createContext<OverlayStackContextValue | null>(null);

export function OverlayStackProvider({ children }: { children: ReactNode }) {
  const [layers, setLayers] = useState<string[]>([]);
  const [revealedLayerId, setRevealedLayerId] = useState<string | null>(null);
  const layersRef = useRef<string[]>([]);
  const closeHandlersRef = useRef(new Map<string, () => void>());
  const revealTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasOpenOverlays = layers.length > 0;
  const [showBackdrop, setShowBackdrop] = useState(false);
  const [backdropVisible, setBackdropVisible] = useState(false);

  const clearRevealTimeout = useCallback(() => {
    if (!revealTimeoutRef.current) return;
    clearTimeout(revealTimeoutRef.current);
    revealTimeoutRef.current = null;
  }, []);

  const scheduleReveal = useCallback((
    layerId: string,
    expectedTopLayerId: string,
  ) => {
    clearRevealTimeout();
    revealTimeoutRef.current = setTimeout(() => {
      revealTimeoutRef.current = null;
      const currentLayers = layersRef.current;
      if (
        currentLayers.includes(layerId)
        && currentLayers[currentLayers.length - 1] === expectedTopLayerId
      ) {
        setRevealedLayerId(layerId);
      }
    }, OVERLAY_LAYER_ENTRY_DELAY_MS);
  }, [clearRevealTimeout]);

  const register = useCallback((layerId: string, onClose: () => void) => {
    const currentLayers = layersRef.current;
    const previousTopLayerId = currentLayers[currentLayers.length - 1];
    const nextLayers = bringOverlayLayerToFront(currentLayers, layerId);

    closeHandlersRef.current.set(layerId, onClose);
    layersRef.current = nextLayers;
    setLayers(nextLayers);

    if (!previousTopLayerId || previousTopLayerId === layerId) {
      clearRevealTimeout();
      setRevealedLayerId(layerId);
      return;
    }

    setRevealedLayerId(null);
    scheduleReveal(layerId, layerId);
  }, [clearRevealTimeout, scheduleReveal]);

  const beginClose = useCallback((layerId: string) => {
    const currentLayers = layersRef.current;
    if (currentLayers[currentLayers.length - 1] !== layerId) return;

    const previousLayerId = currentLayers[currentLayers.length - 2];
    if (previousLayerId) {
      scheduleReveal(previousLayerId, layerId);
    }
  }, [scheduleReveal]);

  const unregister = useCallback((layerId: string) => {
    const nextLayers = removeOverlayLayer(layersRef.current, layerId);

    closeHandlersRef.current.delete(layerId);
    layersRef.current = nextLayers;
    setLayers(nextLayers);
    clearRevealTimeout();
    setRevealedLayerId(nextLayers[nextLayers.length - 1] ?? null);
  }, [clearRevealTimeout]);

  useEffect(() => clearRevealTimeout, [clearRevealTimeout]);

  useEffect(() => {
    let animationFrameId: number | null = null;
    let hideTimeoutId: ReturnType<typeof setTimeout> | null = null;

    if (hasOpenOverlays) {
      setShowBackdrop(true);
      animationFrameId = requestAnimationFrame(() => setBackdropVisible(true));
    } else {
      setBackdropVisible(false);
      hideTimeoutId = setTimeout(
        () => setShowBackdrop(false),
        OVERLAY_TRANSITION_MS,
      );
    }

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      if (hideTimeoutId) clearTimeout(hideTimeoutId);
    };
  }, [hasOpenOverlays]);

  const closeTopLayer = useCallback(() => {
    const topLayerId = layersRef.current[layersRef.current.length - 1];
    if (!topLayerId) return;
    closeHandlersRef.current.get(topLayerId)?.();
  }, []);

  useEffect(() => {
    if (!hasOpenOverlays) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [hasOpenOverlays]);

  useEffect(() => {
    if (!hasOpenOverlays) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;

      event.preventDefault();
      event.stopImmediatePropagation();
      closeTopLayer();
    };

    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [closeTopLayer, hasOpenOverlays]);

  const value = useMemo(
    () => ({ layers, revealedLayerId, beginClose, register, unregister }),
    [beginClose, layers, revealedLayerId, register, unregister],
  );

  return (
    <OverlayStackContext.Provider value={value}>
      {children}
      {showBackdrop && (
        <button
          type="button"
          className={`fixed inset-0 cursor-default border-0 p-0 ${themeColors.ui.overlayBackdrop} ${themeColors.blurSm} transition-opacity duration-300`}
          style={{
            opacity: backdropVisible ? 1 : 0,
            zIndex: OVERLAY_BASE_Z_INDEX - 1,
          }}
          onClick={closeTopLayer}
          aria-label="Fermer l'overlay"
        />
      )}
    </OverlayStackContext.Provider>
  );
}

export function useOverlayLayer(
  active: boolean,
  closing: boolean,
  onClose: () => void,
) {
  const stack = useContext(OverlayStackContext);
  const layerId = useId();
  const beginClose = stack?.beginClose;
  const register = stack?.register;
  const unregister = stack?.unregister;
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const closeLayer = useCallback(() => onCloseRef.current(), []);

  useEffect(() => {
    if (!active || !register || !unregister) return;

    register(layerId, closeLayer);
    return () => unregister(layerId);
  }, [active, closeLayer, layerId, register, unregister]);

  useEffect(() => {
    if (active && closing) beginClose?.(layerId);
  }, [active, beginClose, closing, layerId]);

  const layerIndex = stack?.layers.indexOf(layerId) ?? -1;

  return {
    revealed: stack
      ? stack.revealedLayerId === layerId
      : true,
    top: stack
      ? layerIndex === stack.layers.length - 1
      : true,
    zIndex: OVERLAY_BASE_Z_INDEX + Math.max(layerIndex, 0),
  };
}
