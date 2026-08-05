'use client';

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { themeColors } from '@/lib/theme-colors';
import { OVERWORLD_MAP_WORLD, type MapMetadata, type MapWorld } from '@/lib/map/metadata';
import type { MapLineOverlay } from '@/lib/map/overlays';
import type { MapRoutePath } from '@/lib/map/route-path';
import MapCanvas from './MapCanvas';
import MapEdgeHalo from './MapEdgeHalo';
import MapPointsLayer from './MapPointsLayer';
import MapStatus from './MapStatus';
import RouteMapCanvas from './RouteMapCanvas';
import MapTooltipPortal from '../tooltip/MapTooltipPortal';
import {
  ICON_MIN_MAP_CELL_PIXEL_SIZE,
  MAP_ICON_MAX_SCALE,
  MAP_ICON_MIN_SCALE,
  MAP_TILE_MIN_OVERVIEW_PIXEL_SIZE,
} from '../core/map-constants';
import { getMapDrawRect } from '../core/map-geometry';
import { useMapFocus } from '../hooks/useMapFocus';
import { useMapImage } from '../hooks/useMapImage';
import { useMapInteractions } from '../hooks/useMapInteractions';
import { useMapPoints } from '../hooks/useMapPoints';
import { useMapRoute } from '../hooks/useMapRoute';
import { useMapRoutePoints } from '../hooks/useMapRoutePoints';
import { useMapTiles } from '../hooks/useMapTiles';
import { useMapTooltip } from '../hooks/useMapTooltip';
import { useMapView } from '../hooks/useMapView';
import { usePointRenderMode } from '../hooks/usePointRenderMode';
import { MIN_ZOOM, clamp, type MapPan } from '../core/map-view';
import type { InteractiveMapPoint, ScreenMapPoint } from '../core/map-types';
;
interface InteractiveMapRendererProps {
  metadata: MapMetadata;
  points: InteractiveMapPoint[];
  loading?: boolean;
  error?: string | null;
  variant?: 'panel' | 'background';
  world?: MapWorld;
  lineOverlays?: MapLineOverlay[];
  focusedPointId?: string;
  routePath?: MapRoutePath | null;
  activeRouteSegmentId?: string | null;
  syncedPlayerUuid?: string | null;
  linkedMinecraftUuid?: string | null;
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
  routePath = null,
  activeRouteSegmentId,
  syncedPlayerUuid,
  linkedMinecraftUuid,
  onPointSelect,
}: InteractiveMapRendererProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const previousWorldRef = useRef(world);
  const viewByWorldRef = useRef<Partial<Record<MapWorld, MapViewSnapshot>>>({});
  const { imageFailed, mapImage } = useMapImage(metadata.overview.image);
  const view = useMapView(metadata);
  const mapTiles = useMapTiles({
    metadata,
    viewport: view.viewport,
    baseSize: view.baseSize,
    zoom: view.zoom,
    pan: view.pan,
    enabled: view.mapCellPixelSize >= MAP_TILE_MIN_OVERVIEW_PIXEL_SIZE,
  });
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
  const {
    tooltips,
    raisedPointId,
    tooltipPortalRoot,
    hoveredPointRef,
    setRaisedPointId,
    setRouteTooltipPoints,
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
  } = useMapTooltip(effectivePointRenderMode, !activeRouteSegmentId);
  const handleFocusComplete = useCallback((point: ScreenMapPoint) => {
    showFocusedPointTooltip(point);
  }, [showFocusedPointTooltip]);
  const activeRoute = useMapRoute({
    routePath,
    activeSegmentId: activeRouteSegmentId,
    world,
    isBlocked,
    metadata,
    viewport: view.viewport,
    baseSize: view.baseSize,
    maxZoom: view.maxZoom,
    clampPan: view.clampPan,
    animateView: view.animateView,
    clearPointTooltip,
  });
  const routePointState = useMapRoutePoints({
    segments: activeRoute.segments,
    markers: activeRoute.markers,
    screenPoints: pointsState.screenPoints,
    metadata,
    viewport: view.viewport,
    baseSize: view.baseSize,
    pan: view.pan,
    zoom: view.zoom,
    setRouteTooltipPoints,
  });
  const effectiveFocusedPointId = activeRoute.segments.length > 0
    ? routePointState.targetPoint?.id
    : focusedPointId;
  const focusedPoint = useMemo(() => (
    effectiveFocusedPointId
      ? pointsState.positionedPoints.find((point) => point.id === effectiveFocusedPointId)
      : undefined
  ), [effectiveFocusedPointId, pointsState.positionedPoints]);
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
    scheduleView: view.scheduleView,
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
    enabled: activeRoute.segments.length === 0,
    focusedPointId: effectiveFocusedPointId,
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

    return getMapDrawRect(
      view.viewport,
      view.baseSize,
      view.zoom,
      view.pan
    );
  }, [view.baseSize, view.pan, view.viewport, view.zoom]);

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
        aria-label={`Carte interactive ${world === OVERWORLD_MAP_WORLD ? "de l'Overworld" : 'du Nether'}`}
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
          mapTiles={mapTiles}
          viewport={view.viewport}
          baseSize={view.baseSize}
          zoom={view.zoom}
          pan={view.pan}
          metadata={metadata}
          lineOverlays={lineOverlays}
          showBlockGrid={!interactions.isZooming}
        />
        {!isBlocked && activeRoute.focusKey && (
          <RouteMapCanvas
            animationKey={activeRoute.focusKey}
            segments={activeRoute.segments}
            markers={activeRoute.markers}
            metadata={metadata}
            viewport={view.viewport}
            baseSize={view.baseSize}
            zoom={view.zoom}
            iconScale={iconScale}
            pan={view.pan}
            playerIdentifier={syncedPlayerUuid}
            fallbackPlayerIdentifier={linkedMinecraftUuid}
          />
        )}
        {!isBlocked && mapBounds && (
          <MapEdgeHalo bounds={mapBounds} viewport={view.viewport} world={world} />
        )}

        {!isBlocked && (
          <MapPointsLayer
            points={pointsState.renderedScreenPoints}
            pointRenderMode={effectivePointRenderMode}
            iconScale={iconScale}
            animatePointTransitions={animatePointTransitions && !isWorldSwitching}
            focusedPointId={effectiveFocusedPointId}
            routePointIds={routePointState.pointIds}
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
