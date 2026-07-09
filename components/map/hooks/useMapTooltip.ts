import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ICON_TOOLTIP_OFFSET, PLACE_PREVIEW_DELAY_MS, POINT_TOOLTIP_OFFSET } from '../core/map-constants';
import type { MapTooltip, PointRenderMode, ScreenMapPoint } from '../core/map-types';

export const useMapTooltip = (pointRenderMode: PointRenderMode) => {
  const [focusTooltip, setFocusTooltip] = useState<MapTooltip | null>(null);
  const [hoverTooltip, setHoverTooltip] = useState<MapTooltip | null>(null);
  const [raisedPointId, setRaisedPointId] = useState<string | null>(null);
  const [tooltipPortalRoot, setTooltipPortalRoot] = useState<HTMLElement | null>(null);
  const hoveredPointRef = useRef<{ id: string; startedAt: number } | null>(null);
  const focusedTooltipPointIdRef = useRef<string | null>(null);
  const isFocusedPreviewPinnedRef = useRef(false);
  const screenPointByIdRef = useRef(new Map<string, ScreenMapPoint>());
  const placePreviewTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const preloadedPreviewImageAspectRatiosRef = useRef(new Map<string, number>());
  const preloadingPreviewImagesRef = useRef(new Map<string, HTMLImageElement>());

  useEffect(() => { setTooltipPortalRoot(document.body); }, []);

  const clearPlacePreviewTimeout = useCallback(() => {
    if (!placePreviewTimeoutRef.current) return;
    clearTimeout(placePreviewTimeoutRef.current);
    placePreviewTimeoutRef.current = null;
  }, []);

  const getTooltipOffset = useCallback((point: ScreenMapPoint) => (
    point.iconSrc && (focusedTooltipPointIdRef.current === point.id || pointRenderMode !== 'points')
      ? ICON_TOOLTIP_OFFSET
      : POINT_TOOLTIP_OFFSET
  ), [pointRenderMode]);

  const buildTooltip = useCallback((point: ScreenMapPoint, expanded: boolean): MapTooltip | null => {
    const label = point.label;
    if (!label) return null;
    const tooltipOffset = getTooltipOffset(point);
    const previewImageAspectRatio = point.previewImageSrc
      ? preloadedPreviewImageAspectRatiosRef.current.get(point.previewImageSrc)
      : undefined;

    return {
      pointId: point.id,
      pointLeft: point.screen.left,
      pointTop: point.screen.top,
      offset: tooltipOffset,
      label,
      previewImageSrc: point.previewImageSrc,
      previewImageAspectRatio,
      expanded: expanded && Boolean(point.previewImageSrc),
    };
  }, [getTooltipOffset]);

  const showPointTooltip = useCallback((point: ScreenMapPoint, expanded: boolean) => {
    if (focusedTooltipPointIdRef.current === point.id) {
      setFocusTooltip((currentTooltip) => (
        buildTooltip(point, isFocusedPreviewPinnedRef.current && !expanded ? Boolean(currentTooltip?.expanded) : expanded)
      ));
      setHoverTooltip((currentTooltip) => currentTooltip?.pointId === point.id ? null : currentTooltip);
      return;
    }

    const focusedPointId = focusedTooltipPointIdRef.current;
    if (focusedPointId) {
      isFocusedPreviewPinnedRef.current = false;
      const focusedPoint = screenPointByIdRef.current.get(focusedPointId);
      if (focusedPoint) {
        setFocusTooltip(buildTooltip(focusedPoint, false));
      }
    }

    const nextTooltip = buildTooltip(point, expanded);
    if (!nextTooltip) {
      return;
    }

    setHoverTooltip(nextTooltip);
  }, [buildTooltip]);

  const preloadPreviewImage = useCallback((src: string | undefined, pointId: string) => {
    if (!src || preloadedPreviewImageAspectRatiosRef.current.has(src) || preloadingPreviewImagesRef.current.has(src)) {
      return;
    }

    const image = new Image();
    preloadingPreviewImagesRef.current.set(src, image);

    image.onload = () => {
      preloadingPreviewImagesRef.current.delete(src);
      const aspectRatio = image.naturalWidth > 0 && image.naturalHeight > 0
        ? image.naturalWidth / image.naturalHeight
        : 1;
      preloadedPreviewImageAspectRatiosRef.current.set(src, aspectRatio);

      const latestPoint = screenPointByIdRef.current.get(pointId);
      if (!latestPoint?.previewImageSrc) {
        return;
      }

      if (focusedTooltipPointIdRef.current === pointId) {
        setFocusTooltip((currentTooltip) => (
          currentTooltip?.pointId === pointId
            ? buildTooltip(latestPoint, currentTooltip.expanded)
            : currentTooltip
        ));
      }

      const hoveredPoint = hoveredPointRef.current;
      const isHoveredLongEnough = Boolean(
        hoveredPoint &&
        hoveredPoint.id === pointId &&
        Date.now() - hoveredPoint.startedAt >= PLACE_PREVIEW_DELAY_MS
      );
      if (isHoveredLongEnough && latestPoint.kind === 'place') {
        const nextTooltip = buildTooltip(latestPoint, true);
        if (focusedTooltipPointIdRef.current === pointId) {
          setFocusTooltip(nextTooltip);
        } else {
          setHoverTooltip(nextTooltip);
        }
      }
    };

    image.onerror = () => preloadingPreviewImagesRef.current.delete(src);

    image.src = src;
  }, [buildTooltip]);

  const updateScreenPointLookup = useCallback((screenPointById: Map<string, ScreenMapPoint>) => {
    screenPointByIdRef.current = screenPointById;

    const refreshTooltip = (currentTooltip: MapTooltip | null) => {
      if (!currentTooltip) return null;

      const point = screenPointById.get(currentTooltip.pointId);
      if (!point) return null;

      return buildTooltip(point, currentTooltip.expanded);
    };

    setFocusTooltip((currentTooltip) => {
      const focusedPointId = focusedTooltipPointIdRef.current;
      if (!focusedPointId) return null;

      const point = screenPointById.get(focusedPointId);
      if (!point) return null;

      return buildTooltip(point, currentTooltip?.pointId === focusedPointId ? currentTooltip.expanded : false);
    });
    setHoverTooltip(refreshTooltip);
  }, [buildTooltip]);

  const updatePointTooltipPosition = useCallback((point: ScreenMapPoint) => {
    if (focusedTooltipPointIdRef.current === point.id) {
      setFocusTooltip((currentTooltip) => (
        buildTooltip(point, isFocusedPreviewPinnedRef.current ? Boolean(currentTooltip?.expanded) : currentTooltip?.pointId === point.id ? currentTooltip.expanded : false)
      ));
      return;
    }

    setHoverTooltip((currentTooltip) => (
      buildTooltip(point, currentTooltip?.pointId === point.id ? currentTooltip.expanded : false)
    ));
  }, [buildTooltip]);

  const schedulePlacePreview = useCallback((point: ScreenMapPoint) => {
    clearPlacePreviewTimeout();

    if (point.kind !== 'place') {
      return;
    }

    placePreviewTimeoutRef.current = setTimeout(() => {
      placePreviewTimeoutRef.current = null;
      const hoveredPoint = hoveredPointRef.current;

      if (!hoveredPoint || hoveredPoint.id !== point.id) {
        return;
      }

      const latestPoint = screenPointByIdRef.current.get(point.id);
      if (!latestPoint || latestPoint.kind !== 'place') {
        return;
      }

      if (!latestPoint.previewImageSrc || preloadedPreviewImageAspectRatiosRef.current.has(latestPoint.previewImageSrc)) {
        showPointTooltip(latestPoint, true);
      }
    }, PLACE_PREVIEW_DELAY_MS);
  }, [clearPlacePreviewTimeout, showPointTooltip]);

  const showFocusedPointTooltip = useCallback((point: ScreenMapPoint) => {
    focusedTooltipPointIdRef.current = point.id;
    isFocusedPreviewPinnedRef.current = true;
    setRaisedPointId(point.id);
    preloadPreviewImage(point.previewImageSrc, point.id);
    setFocusTooltip(buildTooltip(point, true));
  }, [buildTooltip, preloadPreviewImage]);

  const collapseFocusedPreview = useCallback(() => {
    isFocusedPreviewPinnedRef.current = false;
    hoveredPointRef.current = null;
    clearPlacePreviewTimeout();
    setHoverTooltip(null);

    const focusedPointId = focusedTooltipPointIdRef.current;
    if (!focusedPointId) {
      setRaisedPointId(null);
      return;
    }

    const point = screenPointByIdRef.current.get(focusedPointId);
    if (!point) {
      setFocusTooltip(null);
      return;
    }

    setRaisedPointId(null);
    setFocusTooltip(buildTooltip(point, false));
  }, [buildTooltip, clearPlacePreviewTimeout]);

  const hidePointTooltip = useCallback(() => {
    const hoveredPointId = hoveredPointRef.current?.id;
    hoveredPointRef.current = null;
    clearPlacePreviewTimeout();
    setHoverTooltip(null);
    if (
      hoveredPointId &&
      hoveredPointId === focusedTooltipPointIdRef.current &&
      !isFocusedPreviewPinnedRef.current
    ) {
      const focusedPoint = screenPointByIdRef.current.get(hoveredPointId);
      setFocusTooltip(focusedPoint ? buildTooltip(focusedPoint, false) : null);
    }
    setRaisedPointId(focusedTooltipPointIdRef.current);
  }, [buildTooltip, clearPlacePreviewTimeout]);

  const hidePreviewTooltip = useCallback((pointId: string) => {
    if (hoveredPointRef.current?.id === pointId) {
      hoveredPointRef.current = null;
      clearPlacePreviewTimeout();
      setHoverTooltip(null);
    }

    if (focusedTooltipPointIdRef.current !== pointId) {
      setRaisedPointId(focusedTooltipPointIdRef.current);
      return;
    }

    if (isFocusedPreviewPinnedRef.current) {
      return;
    }

    const point = screenPointByIdRef.current.get(pointId);
    setFocusTooltip(point ? buildTooltip(point, false) : null);
    setRaisedPointId(null);
  }, [buildTooltip, clearPlacePreviewTimeout]);

  const clearPointTooltip = useCallback(() => {
    hoveredPointRef.current = null;
    focusedTooltipPointIdRef.current = null;
    isFocusedPreviewPinnedRef.current = false;
    clearPlacePreviewTimeout();
    setFocusTooltip(null);
    setHoverTooltip(null);
    setRaisedPointId(null);
  }, [clearPlacePreviewTimeout]);

  const tooltips = useMemo(() => (
    [focusTooltip, hoverTooltip].filter((currentTooltip): currentTooltip is MapTooltip => Boolean(currentTooltip))
  ), [focusTooltip, hoverTooltip]);

  useEffect(() => () => {
    clearPlacePreviewTimeout();
    preloadingPreviewImagesRef.current.forEach((image) => {
      image.onload = null; image.onerror = null;
    });
    preloadingPreviewImagesRef.current.clear();
  }, [clearPlacePreviewTimeout]);

  return {
    tooltips,
    raisedPointId,
    tooltipPortalRoot,
    hoveredPointRef,
    setRaisedPointId,
    updateScreenPointLookup,
    preloadPreviewImage,
    showPointTooltip,
    updatePointTooltipPosition,
    schedulePlacePreview,
    showFocusedPointTooltip,
    collapseFocusedPreview,
    hidePointTooltip,
    hidePreviewTooltip,
    clearPointTooltip,
  };
};
