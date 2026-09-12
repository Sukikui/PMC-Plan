import { useMemo } from 'react';
import { useMapAppearance } from '@/components/preferences/PreferencesProvider';
import {
  ICON_MAX_MAP_CELL_PIXEL_SIZE,
  ICON_MIN_MAP_CELL_PIXEL_SIZE,
  MAP_ICON_BASE_SIZE_PX,
  MAP_ICON_MAX_SCALE,
  MAP_ICON_MIN_SCALE,
  getScaledMapIconSizePx,
} from '../core/map-constants';
import type { ScreenMapPoint } from '../core/map-types';
import { clamp, getZoomForMapCellPixelSize, MIN_ZOOM, type MapViewport } from '../core/map-view';
import type { MapMetadata } from '@/lib/map/metadata';
import { findDominantMapSpace } from '../core/dominant-space';

interface MapRenderingPreferencesOptions {
  activeRouteSegmentId?: string | null;
  baseWidth: number;
  mapCellPixelSize: number;
  metadata: MapMetadata;
  preview: boolean;
  renderedPoints: ScreenMapPoint[];
  visiblePoints: ScreenMapPoint[];
  viewport: MapViewport;
  zoom: number;
}

export function useMapRenderingPreferences({
  activeRouteSegmentId,
  baseWidth,
  mapCellPixelSize,
  metadata,
  preview,
  renderedPoints,
  visiblePoints,
  viewport,
  zoom,
}: MapRenderingPreferencesOptions) {
  const preferences = useMapAppearance();
  const iconScale = useMemo(() => {
    const maximum = getZoomForMapCellPixelSize(
      baseWidth,
      metadata,
      ICON_MAX_MAP_CELL_PIXEL_SIZE,
    );
    const range = maximum - MIN_ZOOM;
    const progress = range > 0 ? clamp((zoom - MIN_ZOOM) / range, 0, 1) : 0;
    return MAP_ICON_MIN_SCALE + (MAP_ICON_MAX_SCALE - MAP_ICON_MIN_SCALE) * progress;
  }, [baseWidth, metadata, zoom]);
  const routeActive = Boolean(activeRouteSegmentId);
  const showPointIcons = preferences.zoomIconsEnabled
    && mapCellPixelSize >= ICON_MIN_MAP_CELL_PIXEL_SIZE;
  const automaticLabelPoints = preferences.zoomLabelsEnabled
    && !routeActive
    && mapCellPixelSize >= ICON_MIN_MAP_CELL_PIXEL_SIZE
    ? (preview ? visiblePoints : renderedPoints)
    : undefined;
  const dominantSpace = useMemo(() => (
    preferences.dominantSpaceIndicatorEnabled && showPointIcons && !preview
      ? findDominantMapSpace(visiblePoints, viewport)
      : null
  ), [preferences.dominantSpaceIndicatorEnabled, preview, showPointIcons, viewport, visiblePoints]);
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
    dominantSpace,
    iconScale,
    pointAppearance,
    pointerCoordinatesEnabled: preferences.pointerCoordinatesEnabled,
    previewImagesEnabled: preferences.imagePreviewsEnabled && !routeActive,
    showPointIcons,
    tooltipOffsets,
  };
}
