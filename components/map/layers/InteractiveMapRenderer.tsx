'use client';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { themeColors } from '@/lib/theme-colors';
import { OVERWORLD_MAP_WORLD } from '@/lib/map/metadata';
import MapCanvas from './MapCanvas';
import MapEdgeHalo from './MapEdgeHalo';
import MapPointsLayer from './MapPointsLayer';
import MapRendererStatus from './MapRendererStatus';
import MapGridInteractionLayer from './MapGridInteractionLayer';
import MapDominantSpaceIndicator from './MapDominantSpaceIndicator';
import RouteMapCanvas from './RouteMapCanvas';
import MapTooltipPortal from '../tooltip/MapTooltipPortal';
import {
  BLOCK_GRID_MIN_PIXEL_SIZE,
  MAP_TILE_MIN_OVERVIEW_PIXEL_SIZE,
} from '../core/map-constants';
import { getMapDrawRect } from '../core/map-geometry';
import { getMapBlockPixelSize } from '../core/map-grid';
import { useMapFocus } from '../hooks/useMapFocus';
import { useMapImage } from '../hooks/useMapImage';
import { useMapInteractions } from '../hooks/useMapInteractions';
import { useMapPoints } from '../hooks/useMapPoints';
import { useMapRoute } from '../hooks/useMapRoute';
import { useMapRoutePoints } from '../hooks/useMapRoutePoints';
import { useMapTiles } from '../hooks/useMapTiles';
import { useMapTooltip } from '../hooks/useMapTooltip';
import { useMapView } from '../hooks/useMapView';
import { useMapGridInteraction } from '../hooks/useMapGridInteraction';
import { useMapRenderingPreferences } from '../hooks/useMapRenderingPreferences';
import { useMapWorldViewPersistence } from '../hooks/useMapWorldViewPersistence';
import { usePointRenderMode, useViewportPointIcons } from '../hooks/usePointRenderMode';
import type { InteractiveMapRendererProps, ScreenMapPoint } from '../core/map-types';
export default function InteractiveMapRenderer({
  previewArea,
  previewImagePortalRoot,
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
  enableGridContentCreation = false,
  onMapClick,
  onPointSelect,
}: InteractiveMapRendererProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { imageFailed, mapImage } = useMapImage(previewArea ? '' : metadata.overview.image);
  const view = useMapView(metadata, previewArea);
  const isWorldSwitching = useMapWorldViewPersistence({
    cancelAnimation: view.cancelAnimation,
    clampPan: view.clampPan,
    commitView: view.commitView,
    maxZoom: view.maxZoom,
    panRef: view.panRef,
    world,
    zoomRef: view.zoomRef,
  });
  const mapTiles = useMapTiles({
    overscan: previewArea ? 0 : 1,
    metadata,
    viewport: view.viewport,
    baseSize: view.baseSize,
    zoom: view.zoom,
    pan: view.pan,
    enabled: previewArea ? view.zoom >= view.minZoom : view.mapCellPixelSize >= MAP_TILE_MIN_OVERVIEW_PIXEL_SIZE,
  });
  const isBlocked = loading || !!error || (imageFailed && !metadata.fallbackBackground);
  const mapDrawRect = useMemo(() => getMapDrawRect(
    view.viewport, view.baseSize, view.zoom, view.pan,
  ), [view.baseSize, view.pan, view.viewport, view.zoom]);
  const gridEnabled = !isBlocked
    && getMapBlockPixelSize(metadata, mapDrawRect) >= BLOCK_GRID_MIN_PIXEL_SIZE;
  const gridContentCreationEnabled = enableGridContentCreation && !activeRouteSegmentId;
  const gridSelectionEnabled = gridEnabled && gridContentCreationEnabled;
  const pointsState = useMapPoints({
    points,
    metadata,
    viewport: view.viewport,
    baseSize: view.baseSize,
    pan: view.pan,
    zoom: view.zoom,
  });
  const appearance = useMapRenderingPreferences({
    activeRouteSegmentId,
    baseWidth: view.baseSize.width,
    mapCellPixelSize: view.mapCellPixelSize,
    metadata,
    preview: Boolean(previewArea),
    renderedPoints: pointsState.renderedScreenPoints,
    visiblePoints: pointsState.visibleScreenPoints,
    viewport: view.viewport,
    zoom: view.zoom,
  });
  const { iconScale } = appearance;
  const { pointRenderMode, animatePointTransitions } = usePointRenderMode(appearance.showPointIcons, world);
  const effectivePointRenderMode = isWorldSwitching
    ? (appearance.showPointIcons ? 'icons' : 'points')
    : pointRenderMode;
  const pointerTrackingEnabled = appearance.pointerCoordinatesEnabled || gridSelectionEnabled;
  const gridInteraction = useMapGridInteraction({
    baseSize: view.baseSize,
    hoverEnabled: pointerTrackingEnabled,
    metadata,
    pan: view.pan,
    resetKey: world,
    selectionEnabled: gridSelectionEnabled,
    viewport: view.viewport,
    zoom: view.zoom,
  });
  const {
    tooltips,
    raisedPointId,
    hoveredPointRef,
    setRaisedPointId,
    setRouteTooltipPoints,
    updateScreenPointLookup,
    preloadPreviewImage,
    showPointTooltip,
    updatePointTooltipPosition,
    schedulePreview,
    showFocusedPointTooltip,
    collapseFocusedPreview,
    hidePointTooltip,
    hidePreviewTooltip,
    clearPointTooltip,
  } = useMapTooltip(
    effectivePointRenderMode,
    appearance.previewImagesEnabled,
    appearance.automaticLabelPoints,
    appearance.tooltipOffsets,
  );
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
    gridInteraction.clearSelection();
    hidePointTooltip();
  }, [collapseFocusedPreview, gridInteraction, hidePointTooltip]);
  const handleMapClick = useCallback((position: { x: number; y: number }) => {
    onMapClick?.();
    gridInteraction.selectCell(position);
  }, [gridInteraction, onMapClick]);
  const interactions = useMapInteractions({
    minZoom: view.minZoom,
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
    onMapClick: handleMapClick,
    onPointSelect,
  });
  const iconPointIds = useViewportPointIcons({
    visiblePointIds: pointsState.visiblePointIds,
    zoom: view.zoom,
    zoomDirection: interactions.zoomDirection,
    showPointIcons: appearance.showPointIcons,
    pointRenderMode: effectivePointRenderMode,
    resetKey: world,
  });
  const blockGridVisible = gridEnabled && !interactions.isZooming;
  useEffect(() => {
    clearPointTooltip();
  }, [clearPointTooltip, world]);
  useEffect(() => {
    updateScreenPointLookup(pointsState.screenPointById);
  }, [pointsState.screenPointById, updateScreenPointLookup]);
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
  const mapBounds = view.viewport.width
    && view.viewport.height
    && view.baseSize.width
    && view.baseSize.height
    ? mapDrawRect
    : null;
  const rendererClassName = variant === 'background'
    ? 'relative isolate h-full w-full min-h-0 overflow-hidden select-none'
    : `relative isolate flex-1 min-h-0 ${themeColors.panel.secondary} rounded-b-xl overflow-hidden select-none`;
  return (
      <div
        ref={view.viewportRef}
        className={rendererClassName}
        style={{
          overscrollBehavior: 'contain', touchAction: 'none',
          cursor: interactions.isPanning
            ? 'grabbing'
            : blockGridVisible && gridContentCreationEnabled
              ? 'crosshair'
              : 'grab',
        }}
        aria-label={`Carte interactive ${world === OVERWORLD_MAP_WORLD ? "de l'Overworld" : 'du Nether'}`}
        role="application"
        onWheel={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          gridInteraction.updateHover({ x: event.clientX - rect.left, y: event.clientY - rect.top });
          interactions.handleWheel(event);
        }}
        onPointerDown={interactions.handlePointerDown}
        onPointerMove={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          gridInteraction.updateHover({ x: event.clientX - rect.left, y: event.clientY - rect.top });
          interactions.handlePointerMove(event);
        }}
        onPointerLeave={gridInteraction.clearHover}
        onPointerUp={interactions.handlePointerUp}
        onPointerCancel={(event) => interactions.handlePointerCancel(event.currentTarget, event.pointerId)}
        onLostPointerCapture={interactions.handleLostPointerCapture}
      >
        <MapRendererStatus
          error={error}
          imageUnavailable={imageFailed && !metadata.fallbackBackground}
          loading={loading}
        />
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
          showBlockGrid={blockGridVisible}
        />
        <MapDominantSpaceIndicator space={!isBlocked && effectivePointRenderMode === 'icons' ? appearance.dominantSpace : null} />
        {pointerTrackingEnabled && (
          <MapGridInteractionLayer
            hoveredCell={gridInteraction.hoveredCell}
            onDismiss={gridInteraction.clearSelection}
            routeControlsVisible={Boolean(routePath?.segments.length)}
            selectedCell={gridInteraction.selectedCell}
            showCoordinates={appearance.pointerCoordinatesEnabled || gridEnabled}
            showHighlights={blockGridVisible && gridContentCreationEnabled}
            viewport={view.viewport}
            world={world}
          />
        )}
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
            iconPointIds={iconPointIds}
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
            schedulePreview={schedulePreview}
            hidePointTooltip={hidePointTooltip}
            pointAppearance={appearance.pointAppearance}
            onPointSelect={onPointSelect}
          />
        )}
        <MapTooltipPortal
          compact={Boolean(previewArea)}
          dominantSpaceId={effectivePointRenderMode === 'icons' ? appearance.dominantSpace?.id : undefined}
          tooltips={tooltips} zoom={view.zoom} iconScale={iconScale}
          pointSizePx={appearance.pointAppearance.size}
          previewImagePortalRoot={previewImagePortalRoot}
          viewport={view.viewport}
          viewportRef={view.viewportRef}
          onPreviewMouseLeave={hidePreviewTooltip}
        />
      </div>
  );
}
