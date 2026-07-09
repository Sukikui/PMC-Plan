'use client';

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import type React from 'react';
import { themeColors } from '@/lib/theme-colors';
import { OVERWORLD_MAP_WORLD, type MapMetadata, type MapWorld } from '@/lib/map/metadata';
import type { MapLineOverlay } from '@/lib/map/overlays';
import MapCanvas from './MapCanvas';
import MapPointsLayer from './MapPointsLayer';
import MapTooltipPortal from '../tooltip/MapTooltipPortal';
import { ICON_MIN_MAP_CELL_PIXEL_SIZE, MAP_ICON_MAX_SCALE, MAP_ICON_MIN_SCALE } from '../core/map-constants';
import { useMapFocus } from '../hooks/useMapFocus';
import { useMapImage } from '../hooks/useMapImage';
import { useMapInteractions } from '../hooks/useMapInteractions';
import { useMapPoints } from '../hooks/useMapPoints';
import { useMapTooltip } from '../hooks/useMapTooltip';
import { useMapView } from '../hooks/useMapView';
import { usePointRenderMode } from '../hooks/usePointRenderMode';
import { MIN_ZOOM, clamp, type MapPan } from '../core/map-view';
import type { InteractiveMapPoint, ScreenMapPoint } from '../core/map-types';

export type {
  InteractiveMapPoint,
  InteractiveMapPointKind,
} from '../core/map-types';

interface InteractiveMapRendererProps {
  metadata: MapMetadata;
  points: InteractiveMapPoint[];
  loading?: boolean;
  error?: string | null;
  variant?: 'panel' | 'background';
  world?: MapWorld;
  lineOverlays?: MapLineOverlay[];
  focusedPointId?: string;
  onPointSelect?: (point: InteractiveMapPoint) => void;
}

type MapViewSnapshot = {
  zoom: number;
  pan: MapPan;
};

export default function InteractiveMapRenderer({
  metadata,
  points,
  loading = false,
  error = null,
  variant = 'panel',
  world = OVERWORLD_MAP_WORLD,
  lineOverlays = [],
  focusedPointId,
  onPointSelect,
}: InteractiveMapRendererProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const previousWorldRef = useRef(world);
  const viewByWorldRef = useRef<Partial<Record<MapWorld, MapViewSnapshot>>>({});
  const { imageFailed, mapImage } = useMapImage(metadata.image);
  const view = useMapView(metadata);
  const showPointIcons = view.mapCellPixelSize >= ICON_MIN_MAP_CELL_PIXEL_SIZE;
  const {
    pointRenderMode,
    animatePointTransitions,
  } = usePointRenderMode(showPointIcons, world);
  const isWorldSwitching = previousWorldRef.current !== world;
  const effectivePointRenderMode = isWorldSwitching
    ? (showPointIcons ? 'icons' : 'points')
    : pointRenderMode;
  const iconScale = useMemo(() => {
    const zoomRange = view.maxZoom - MIN_ZOOM;
    const zoomProgress = zoomRange > 0 ? clamp((view.zoom - MIN_ZOOM) / zoomRange, 0, 1) : 0;
    return MAP_ICON_MIN_SCALE + (MAP_ICON_MAX_SCALE - MAP_ICON_MIN_SCALE) * zoomProgress;
  }, [view.maxZoom, view.zoom]);
  const isBlocked = loading || !!error || (imageFailed && !metadata.fallbackBackground);
  const pointsState = useMapPoints({
    points,
    metadata,
    viewport: view.viewport,
    baseSize: view.baseSize,
    pan: view.pan,
    zoom: view.zoom,
  });
  const focusedPoint = useMemo(() => (
    focusedPointId
      ? pointsState.positionedPoints.find((point) => point.id === focusedPointId)
      : undefined
  ), [focusedPointId, pointsState.positionedPoints]);
  const {
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
  } = useMapTooltip(effectivePointRenderMode);
  const handleFocusComplete = useCallback((point: ScreenMapPoint) => {
    showFocusedPointTooltip(point);
  }, [showFocusedPointTooltip]);
  const handleMapMoveStart = useCallback(() => {
    collapseFocusedPreview();
    hidePointTooltip();
  }, [collapseFocusedPreview, hidePointTooltip]);
  const interactions = useMapInteractions({
    isBlocked,
    viewportRef: view.viewportRef,
    screenPointById: pointsState.screenPointById,
    panRef: view.panRef,
    zoomRef: view.zoomRef,
    maxZoom: view.maxZoom,
    clampPan: view.clampPan,
    commitPan: view.commitPan,
    commitView: view.commitView,
    cancelAnimation: view.cancelAnimation,
    onMapMoveStart: handleMapMoveStart,
    onPointSelect,
  });

  useLayoutEffect(() => {
    const previousWorld = previousWorldRef.current;
    if (previousWorld === world) {
      return;
    }

    view.cancelAnimation();
    viewByWorldRef.current[previousWorld] = {
      zoom: view.zoomRef.current,
      pan: view.panRef.current,
    };

    const savedView = viewByWorldRef.current[world] ?? {
      zoom: 1,
      pan: { x: 0, y: 0 },
    };
    const nextZoom = clamp(savedView.zoom, MIN_ZOOM, view.maxZoom);
    view.commitView(nextZoom, view.clampPan(savedView.pan, nextZoom));
    clearPointTooltip();
    previousWorldRef.current = world;
  }, [clearPointTooltip, view, world]);

  useEffect(() => {
    updateScreenPointLookup(pointsState.screenPointById);
  }, [pointsState.screenPointById, updateScreenPointLookup]);

  useEffect(() => {
    const node = view.viewportRef.current;
    if (!node) return;

    const preventScroll = (event: WheelEvent) => {
      event.preventDefault();
    };
    node.addEventListener('wheel', preventScroll, { passive: false });
    return () => {
      node.removeEventListener('wheel', preventScroll);
    };
  }, [view.viewportRef]);

  useMapFocus({
    focusedPointId,
    focusedPoint,
    screenPointById: pointsState.screenPointById,
    isBlocked,
    viewport: view.viewport,
    baseSize: view.baseSize,
    metadata,
    maxZoom: view.maxZoom,
    clampPan: view.clampPan,
    animateView: view.animateView,
    cancelAnimation: view.cancelAnimation,
    clearPointTooltip,
    onFocusComplete: handleFocusComplete,
  });

  const mapBounds = useMemo(() => {
    if (!view.viewport.width || !view.viewport.height || !view.baseSize.width || !view.baseSize.height) {
      return null;
    }

    const width = Math.round(view.baseSize.width * view.zoom);
    const height = Math.round(view.baseSize.height * view.zoom);

    return {
      left: Math.round((view.viewport.width - width) / 2 + view.pan.x),
      top: Math.round((view.viewport.height - height) / 2 + view.pan.y),
      width,
      height,
    };
  }, [view.baseSize.height, view.baseSize.width, view.pan.x, view.pan.y, view.viewport.height, view.viewport.width, view.zoom]);

  const rendererClassName = variant === 'background'
    ? 'relative h-full w-full min-h-0 overflow-hidden select-none'
    : `relative flex-1 min-h-0 ${themeColors.panel.secondary} rounded-b-xl overflow-hidden select-none`;

  return (
    <>
      <div
        ref={view.viewportRef}
        className={rendererClassName}
        style={{
          overscrollBehavior: 'contain',
          touchAction: 'none',
          cursor: interactions.isPanning ? 'grabbing' : 'grab',
        }}
        aria-label="Carte interactive de l'Overworld"
        role="application"
        onWheel={interactions.handleWheel}
        onPointerDown={interactions.handlePointerDown}
        onPointerMove={interactions.handlePointerMove}
        onPointerUp={interactions.handlePointerUp}
        onPointerCancel={(event) => interactions.handlePointerCancel(event.currentTarget, event.pointerId)}
        onLostPointerCapture={interactions.handleLostPointerCapture}
      >
        {loading && (
          <MapStatus className={themeColors.text.tertiary}>
            Chargement...
          </MapStatus>
        )}

        {error && (
          <MapStatus className={themeColors.feedback.errorText}>
            {error}
          </MapStatus>
        )}

        {imageFailed && !metadata.fallbackBackground && (
          <MapStatus className={themeColors.feedback.errorText}>
            Image de carte indisponible.
          </MapStatus>
        )}

        <MapCanvas
          canvasRef={canvasRef}
          mapImage={mapImage}
          viewport={view.viewport}
          baseSize={view.baseSize}
          zoom={view.zoom}
          pan={view.pan}
          metadata={metadata}
          lineOverlays={lineOverlays}
        />

        {!isBlocked && mapBounds && (
          <div
            aria-hidden="true"
            className={`pointer-events-none absolute z-10 ${themeColors.map.edgeHalo[world]}`}
            style={mapBounds}
          />
        )}

        {!isBlocked && (
          <MapPointsLayer
            points={pointsState.screenPoints}
            pointRenderMode={effectivePointRenderMode}
            iconScale={iconScale}
            animatePointTransitions={animatePointTransitions && !isWorldSwitching}
            focusedPointId={focusedPointId}
            raisedPointId={raisedPointId}
            setRaisedPointId={setRaisedPointId}
            hoveredPointRef={hoveredPointRef}
            preloadPreviewImage={preloadPreviewImage}
            showPointTooltip={showPointTooltip}
            updatePointTooltipPosition={updatePointTooltipPosition}
            schedulePlacePreview={schedulePlacePreview}
            hidePointTooltip={hidePointTooltip}
            onPointSelect={onPointSelect}
          />
        )}
      </div>

      <MapTooltipPortal
        tooltips={tooltips}
        tooltipPortalRoot={tooltipPortalRoot}
        viewportRef={view.viewportRef}
        onPreviewMouseLeave={hidePreviewTooltip}
      />
    </>
  );
}

function MapStatus({
  children,
  className,
}: {
  children: React.ReactNode;
  className: string;
}) {
  return (
    <div className={`absolute inset-0 z-40 flex items-center justify-center text-center px-6 ${className}`}>
      {children}
    </div>
  );
}
