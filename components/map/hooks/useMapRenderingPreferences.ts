import { useEffect, useMemo, useRef, useState } from 'react';
import { useMapAppearance } from '@/components/preferences/PreferencesProvider';
import type { MapMetadata, MapWorld } from '@/lib/map/metadata';
import type { SpaceReference } from '@/lib/spaces/types';
import {
  ICON_MAX_MAP_CELL_PIXEL_SIZE,
  ICON_MIN_MAP_CELL_PIXEL_SIZE,
  MAP_ICON_BASE_SIZE_PX,
  MAP_ICON_MAX_SCALE,
  MAP_ICON_MIN_SCALE,
  getScaledMapIconSizePx,
} from '../core/map-constants';
import type { ScreenMapPoint } from '../core/map-types';
import {
  clamp,
  getZoomForMapCellPixelSize,
  MIN_ZOOM,
  type MapCameraChange,
  type MapPan,
  type MapSize,
  type MapViewport,
} from '../core/map-view';
import {
  getDisplayedDominantMapSpace,
  getDominantMapSpaceView,
  resolveDominantMapSpace,
  type DominantMapSpaceState,
} from '../core/dominant-space';

interface MapRenderingPreferencesOptions {
  activeRouteSegmentId?: string | null;
  baseSize: MapSize;
  cameraChange: MapCameraChange;
  mapCellPixelSize: number;
  metadata: MapMetadata;
  pan: MapPan;
  preview: boolean;
  renderedPoints: ScreenMapPoint[];
  visiblePoints: ScreenMapPoint[];
  viewport: MapViewport;
  world: MapWorld;
  zoom: number;
}

export function useMapRenderingPreferences({
  activeRouteSegmentId,
  baseSize,
  cameraChange,
  mapCellPixelSize,
  metadata,
  pan,
  preview,
  renderedPoints,
  visiblePoints,
  viewport,
  world,
  zoom,
}: MapRenderingPreferencesOptions) {
  const preferences = useMapAppearance();
  const iconScale = useMemo(() => {
    const maximum = getZoomForMapCellPixelSize(
      baseSize.width,
      metadata,
      ICON_MAX_MAP_CELL_PIXEL_SIZE,
    );
    const range = maximum - MIN_ZOOM;
    const progress = range > 0 ? clamp((zoom - MIN_ZOOM) / range, 0, 1) : 0;
    return MAP_ICON_MIN_SCALE + (MAP_ICON_MAX_SCALE - MAP_ICON_MIN_SCALE) * progress;
  }, [baseSize.width, metadata, zoom]);
  const routeActive = Boolean(activeRouteSegmentId);
  const showPointIcons = preferences.zoomIconsEnabled
    && mapCellPixelSize >= ICON_MIN_MAP_CELL_PIXEL_SIZE;
  const automaticLabelPoints = preferences.zoomLabelsEnabled
    && !routeActive
    && mapCellPixelSize >= ICON_MIN_MAP_CELL_PIXEL_SIZE
    ? (preview ? visiblePoints : renderedPoints)
    : undefined;
  const dominantSpaceEnabled = preferences.dominantSpaceIndicatorEnabled && showPointIcons;
  const [dominantSpace, setDominantSpace] = useState<SpaceReference | null>(null);
  const dominantSpaceStateRef = useRef<DominantMapSpaceState | null>(null);
  const dominantSpaceWorldRef = useRef(world);
  const dominantSpaceView = useMemo(
    () => getDominantMapSpaceView(viewport, baseSize, pan, zoom),
    [baseSize, pan, viewport, zoom],
  );
  useEffect(() => {
    if (dominantSpaceWorldRef.current !== world) {
      dominantSpaceStateRef.current = null;
      dominantSpaceWorldRef.current = world;
    }
    if (!dominantSpaceEnabled || !dominantSpaceView) {
      dominantSpaceStateRef.current = null;
      setDominantSpace(null);
      return;
    }

    const nextState = resolveDominantMapSpace(
      visiblePoints,
      viewport,
      dominantSpaceStateRef.current,
      dominantSpaceView,
      cameraChange,
      preview ? 'viewport' : 'central',
    );
    dominantSpaceStateRef.current = nextState;
    const displayedSpace = getDisplayedDominantMapSpace(nextState);
    setDominantSpace((currentSpace) => (
      currentSpace === displayedSpace ? currentSpace : displayedSpace
    ));
  }, [cameraChange, dominantSpaceEnabled, dominantSpaceView, preview, viewport, visiblePoints, world]);
  const pointAppearance = useMemo(() => ({
    borderWidth: preferences.pointBorderWidth,
    size: preferences.pointSizePx,
    translucentBorder: preferences.translucentPointBorders,
  }), [
    preferences.pointBorderWidth,
    preferences.pointSizePx,
    preferences.translucentPointBorders,
  ]);
  const tooltipOffsets = useMemo(() => ({
    icon: getScaledMapIconSizePx(MAP_ICON_BASE_SIZE_PX, iconScale) / 2 + 4,
    point: preferences.pointSizePx / Math.SQRT2 + 4,
  }), [iconScale, preferences.pointSizePx]);

  return {
    automaticLabelPoints,
    dominantSpace: dominantSpaceEnabled && dominantSpaceWorldRef.current === world
      ? dominantSpace
      : null,
    iconScale,
    pointAppearance,
    pointerCoordinatesEnabled: preferences.pointerCoordinatesEnabled,
    previewImagesEnabled: preferences.imagePreviewsEnabled && !routeActive,
    showPointIcons,
    tooltipOffsets,
  };
}
