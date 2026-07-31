import {
  worldToMapPercent,
  type MapCoordinate,
  type MapMetadata,
} from '@/lib/map/metadata';
import {
  FOCUS_MAP_CELL_PIXEL_SIZE,
  ROUTE_FOCUS_MAX_ZOOM_FACTOR,
} from './map-constants';
import type { MapSafeArea } from './map-panels';
import {
  MIN_ZOOM,
  clamp,
  getZoomForMapCellPixelSize,
  type MapPan,
  type MapSize,
  type MapViewport,
} from './map-view';

interface RouteViewParams {
  points: MapCoordinate[];
  metadata: MapMetadata;
  viewport: MapViewport;
  baseSize: MapSize;
  safeArea: MapSafeArea;
  maxZoom: number;
  clampPan: (pan: MapPan, zoom: number) => MapPan;
}

const ROUTE_PADDING_PX = 44;
const MIN_ROUTE_SPAN_PX = 1;

export const getRouteView = ({
  points,
  metadata,
  viewport,
  baseSize,
  safeArea,
  maxZoom,
  clampPan,
}: RouteViewParams) => {
  if (points.length === 0 || !baseSize.width || !baseSize.height) return null;

  const positions = points.map((point) => worldToMapPercent(metadata, point));
  const leftValues = positions.map((position) => position.left);
  const topValues = positions.map((position) => position.top);
  const minLeft = Math.min(...leftValues);
  const maxLeft = Math.max(...leftValues);
  const minTop = Math.min(...topValues);
  const maxTop = Math.max(...topValues);
  const spanWidth = Math.max(
    MIN_ROUTE_SPAN_PX,
    ((maxLeft - minLeft) / 100) * baseSize.width
  );
  const spanHeight = Math.max(
    MIN_ROUTE_SPAN_PX,
    ((maxTop - minTop) / 100) * baseSize.height
  );
  const availableWidth = Math.max(1, safeArea.right - safeArea.left - ROUTE_PADDING_PX * 2);
  const availableHeight = Math.max(1, safeArea.bottom - safeArea.top - ROUTE_PADDING_PX * 2);
  const defaultFocusZoom = getZoomForMapCellPixelSize(
    baseSize.width,
    metadata,
    FOCUS_MAP_CELL_PIXEL_SIZE
  );
  const routeMaxZoom = Math.min(
    maxZoom,
    defaultFocusZoom * ROUTE_FOCUS_MAX_ZOOM_FACTOR
  );
  const zoom = clamp(
    Math.min(availableWidth / spanWidth, availableHeight / spanHeight),
    MIN_ZOOM,
    routeMaxZoom
  );
  const routeCenter = {
    left: (minLeft + maxLeft) / 2,
    top: (minTop + maxTop) / 2,
  };
  const safeCenter = {
    x: (safeArea.left + safeArea.right) / 2,
    y: (safeArea.top + safeArea.bottom) / 2,
  };
  const pan = clampPan({
    x: safeCenter.x - viewport.width / 2 -
      ((routeCenter.left / 100) - 0.5) * baseSize.width * zoom,
    y: safeCenter.y - viewport.height / 2 -
      ((routeCenter.top / 100) - 0.5) * baseSize.height * zoom,
  }, zoom);

  return { zoom, pan };
};
