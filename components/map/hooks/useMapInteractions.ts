import { useCallback, useEffect, useRef, useState } from 'react';
import type React from 'react';
import {
  CLICK_DRAG_TOLERANCE_PX,
  MAX_WHEEL_DELTA,
  WHEEL_ZOOM_IDLE_DELAY_MS,
  WHEEL_ZOOM_INTENSITY,
} from '../core/map-constants';
import { MIN_ZOOM, clamp, type MapPan } from '../core/map-view';
import type { InteractiveMapPoint, ScreenMapPoint } from '../core/map-types';

interface UseMapInteractionsParams {
  isBlocked: boolean;
  viewportRef: React.RefObject<HTMLDivElement | null>;
  screenPointById: Map<string, ScreenMapPoint>;
  panRef: React.MutableRefObject<MapPan>;
  zoomRef: React.MutableRefObject<number>;
  maxZoom: number;
  clampPan: (nextPan: MapPan, nextZoom: number) => MapPan;
  commitPan: (nextPan: MapPan) => void;
  scheduleView: (nextZoom: number, nextPan: MapPan) => void;
  cancelAnimation: () => void;
  onMapMoveStart: () => void;
  onPointSelect?: (point: InteractiveMapPoint) => void;
}

export const useMapInteractions = ({
  isBlocked,
  viewportRef,
  screenPointById,
  panRef,
  zoomRef,
  maxZoom,
  clampPan,
  commitPan,
  scheduleView,
  cancelAnimation,
  onMapMoveStart,
  onPointSelect,
}: UseMapInteractionsParams) => {
  const [isPanning, setIsPanning] = useState(false);
  const [isZooming, setIsZooming] = useState(false);
  const lastPointerRef = useRef<{ x: number; y: number } | null>(null);
  const pointerDownRef = useRef<{ x: number; y: number } | null>(null);
  const pendingPointSelectRef = useRef<InteractiveMapPoint | null>(null);
  const hasDraggedRef = useRef(false);
  const activePointerIdRef = useRef<number | null>(null);
  const zoomEndTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stopPanning = useCallback((target?: HTMLDivElement, pointerId?: number) => {
    if (target && pointerId !== undefined && target.hasPointerCapture(pointerId)) {
      target.releasePointerCapture(pointerId);
    }

    activePointerIdRef.current = null;
    lastPointerRef.current = null;
    pointerDownRef.current = null;
    pendingPointSelectRef.current = null;
    setIsPanning(false);
  }, []);

  const startMapInteraction = useCallback(() => {
    cancelAnimation();
    onMapMoveStart();
  }, [cancelAnimation, onMapMoveStart]);

  const handleWheel = useCallback((event: React.WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (isBlocked || !viewportRef.current) return;

    const delta = clamp(event.deltaY, -MAX_WHEEL_DELTA, MAX_WHEEL_DELTA);
    const currentZoom = zoomRef.current;
    const nextZoom = clamp(
      currentZoom * Math.exp(-delta * WHEEL_ZOOM_INTENSITY),
      MIN_ZOOM,
      maxZoom
    );
    if (nextZoom === currentZoom) return;

    startMapInteraction();
    setIsZooming(true);
    if (zoomEndTimeoutRef.current) clearTimeout(zoomEndTimeoutRef.current);
    zoomEndTimeoutRef.current = setTimeout(() => {
      zoomEndTimeoutRef.current = null;
      setIsZooming(false);
    }, WHEEL_ZOOM_IDLE_DELAY_MS);

    const rect = viewportRef.current.getBoundingClientRect();
    const pointer = {
      x: event.clientX - rect.left - rect.width / 2,
      y: event.clientY - rect.top - rect.height / 2,
    };
    const mapX = (pointer.x - panRef.current.x) / currentZoom;
    const mapY = (pointer.y - panRef.current.y) / currentZoom;

    scheduleView(nextZoom, clampPan({
      x: pointer.x - mapX * nextZoom,
      y: pointer.y - mapY * nextZoom,
    }, nextZoom));
  }, [clampPan, isBlocked, maxZoom, panRef, scheduleView, startMapInteraction, viewportRef, zoomRef]);

  useEffect(() => () => {
    if (zoomEndTimeoutRef.current) clearTimeout(zoomEndTimeoutRef.current);
  }, []);

  const handlePointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (isBlocked || event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    startMapInteraction();

    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    event.currentTarget.setPointerCapture(event.pointerId);
    activePointerIdRef.current = event.pointerId;
    lastPointerRef.current = { x: event.clientX, y: event.clientY };
    pointerDownRef.current = { x: event.clientX, y: event.clientY };

    const pointElement = event.target instanceof HTMLElement
      ? event.target.closest<HTMLElement>('[data-map-point-id]')
      : null;
    pendingPointSelectRef.current = pointElement?.dataset.mapPointId
      ? screenPointById.get(pointElement.dataset.mapPointId) ?? null
      : null;
    hasDraggedRef.current = false;
    setIsPanning(true);
  }, [isBlocked, screenPointById, startMapInteraction]);

  const handlePointerMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (activePointerIdRef.current !== event.pointerId || !lastPointerRef.current) return;
    event.preventDefault();

    const dx = event.clientX - lastPointerRef.current.x;
    const dy = event.clientY - lastPointerRef.current.y;
    if (pointerDownRef.current) {
      const totalDx = event.clientX - pointerDownRef.current.x;
      const totalDy = event.clientY - pointerDownRef.current.y;
      hasDraggedRef.current = hasDraggedRef.current || Math.hypot(totalDx, totalDy) > CLICK_DRAG_TOLERANCE_PX;
    }

    commitPan(clampPan({
      x: panRef.current.x + dx,
      y: panRef.current.y + dy,
    }, zoomRef.current));
    lastPointerRef.current = { x: event.clientX, y: event.clientY };
  }, [clampPan, commitPan, panRef, zoomRef]);

  const handlePointerUp = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const pointToSelect = pendingPointSelectRef.current;
    const shouldSelectPoint = pointToSelect && !hasDraggedRef.current;
    stopPanning(event.currentTarget, event.pointerId);
    if (shouldSelectPoint) {
      onPointSelect?.(pointToSelect);
    }
  }, [onPointSelect, stopPanning]);

  return {
    isPanning,
    isZooming,
    handleWheel,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerCancel: stopPanning,
    handleLostPointerCapture: () => stopPanning(),
  };
};
