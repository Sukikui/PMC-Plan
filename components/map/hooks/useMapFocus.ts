import { useEffect, useRef } from 'react';
import type { MapMetadata } from '@/lib/map/metadata';
import { FOCUS_MAP_CELL_PIXEL_SIZE } from '../core/map-constants';
import {
  MIN_ZOOM,
  clamp,
  getPanForMapPosition,
  getZoomForMapCellPixelSize,
  type MapPan,
  type MapSize,
  type MapViewport,
} from '../core/map-view';
import type { PositionedMapPoint, ScreenMapPoint } from '../core/map-types';

interface UseMapFocusParams {
  focusedPointId?: string;
  focusedPoint?: PositionedMapPoint;
  screenPointById: Map<string, ScreenMapPoint>;
  isBlocked: boolean;
  viewport: MapViewport;
  baseSize: MapSize;
  metadata: MapMetadata;
  maxZoom: number;
  clampPan: (nextPan: MapPan, nextZoom: number) => MapPan;
  animateView: (nextZoom: number, nextPan: MapPan, onComplete?: () => void) => void;
  cancelAnimation: () => void;
  clearPointTooltip: () => void;
  onFocusComplete: (point: ScreenMapPoint) => void;
}

export const useMapFocus = ({
  focusedPointId,
  focusedPoint,
  screenPointById,
  isBlocked,
  viewport,
  baseSize,
  metadata,
  maxZoom,
  clampPan,
  animateView,
  cancelAnimation,
  clearPointTooltip,
  onFocusComplete,
}: UseMapFocusParams) => {
  const focusedPointIdRef = useRef(focusedPointId);
  const screenPointByIdRef = useRef(screenPointById);
  const clearPointTooltipRef = useRef(clearPointTooltip);
  const onFocusCompleteRef = useRef(onFocusComplete);

  useEffect(() => {
    focusedPointIdRef.current = focusedPointId;
  }, [focusedPointId]);

  useEffect(() => {
    screenPointByIdRef.current = screenPointById;
  }, [screenPointById]);

  useEffect(() => {
    clearPointTooltipRef.current = clearPointTooltip;
  }, [clearPointTooltip]);

  useEffect(() => {
    onFocusCompleteRef.current = onFocusComplete;
  }, [onFocusComplete]);

  useEffect(() => {
    if (!focusedPointId) {
      cancelAnimation();
      clearPointTooltipRef.current();
      return;
    }

    if (
      isBlocked ||
      !focusedPoint ||
      !viewport.width ||
      !viewport.height ||
      !baseSize.width ||
      !baseSize.height
    ) {
      return;
    }

    clearPointTooltipRef.current();

    const desiredZoom = getZoomForMapCellPixelSize(
      baseSize.width,
      metadata,
      FOCUS_MAP_CELL_PIXEL_SIZE
    );
    const nextZoom = clamp(desiredZoom, MIN_ZOOM, maxZoom);
    const nextPan = clampPan(
      getPanForMapPosition(focusedPoint.position, nextZoom, baseSize),
      nextZoom
    );

    animateView(nextZoom, nextPan, () => {
      if (focusedPointIdRef.current !== focusedPointId) {
        return;
      }

      const screenPoint = screenPointByIdRef.current.get(focusedPointId);
      if (screenPoint) {
        onFocusCompleteRef.current(screenPoint);
      }
    });
  }, [
    animateView,
    baseSize,
    cancelAnimation,
    clampPan,
    focusedPoint,
    focusedPointId,
    isBlocked,
    maxZoom,
    metadata,
    viewport.height,
    viewport.width,
  ]);
};
