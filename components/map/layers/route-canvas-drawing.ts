import type { MapRouteMarker, MapRouteSegment } from '@/lib/map/route-path';
import { themeColors } from '@/lib/theme-colors';
import type { MapViewport } from '../core/map-view';

export interface RouteScreenPoint {
  left: number;
  top: number;
}

export type ScreenRouteSegment = Omit<MapRouteSegment, 'points'> & {
  points: RouteScreenPoint[];
};

export type ScreenRouteMarker = Omit<MapRouteMarker, 'point'> & {
  point: RouteScreenPoint;
};

const WAVE_CYCLE_MS = 2400;
const WAVE_HALF_WIDTH = 0.3;
const ROUTE_COLORS = {
  route: themeColors.map.routeLineStroke,
  glow: themeColors.map.routeGlowStroke,
  transition: themeColors.map.transitionLineStroke,
};

export const resizeRouteCanvas = (
  canvas: HTMLCanvasElement,
  viewport: MapViewport,
  pixelRatio: number
) => {
  const width = Math.max(1, Math.floor(viewport.width * pixelRatio));
  const height = Math.max(1, Math.floor(viewport.height * pixelRatio));
  if (canvas.width !== width) canvas.width = width;
  if (canvas.height !== height) canvas.height = height;
  canvas.style.width = `${viewport.width}px`;
  canvas.style.height = `${viewport.height}px`;
};

export const getScreenSegmentsLength = (segments: ScreenRouteSegment[]) => segments.reduce(
  (total, segment) => total + getPolylineLength(segment.points),
  0
);

export const drawRoutePath = (
  context: CanvasRenderingContext2D,
  segments: ScreenRouteSegment[],
  visibleLength: number,
  timestamp: number,
  showWave: boolean
) => {
  drawPartialSegments(context, segments, visibleLength, ROUTE_COLORS.glow, 13, 0.38, 10);
  drawPartialSegments(context, segments, visibleLength, ROUTE_COLORS.route, 7, 0.98);

  if (showWave) {
    drawRouteWave(context, segments, timestamp);
  }
};

export const drawRouteMarkers = (
  context: CanvasRenderingContext2D,
  markers: ScreenRouteMarker[],
  timestamp: number,
  complete: boolean
) => {
  markers.forEach((marker) => {
    if (marker.kind !== 'start' && !complete) return;

    const isTransition = marker.kind === 'transition';
    const pulse = isTransition ? (Math.sin(timestamp / 280) + 1) / 2 : 0;
    const color = isTransition ? ROUTE_COLORS.transition : ROUTE_COLORS.route;
    const radius = isTransition ? 6 + pulse * 1.5 : marker.kind === 'destination' ? 7 : 5;

    context.save();
    context.beginPath();
    context.arc(marker.point.left, marker.point.top, radius, 0, Math.PI * 2);
    context.strokeStyle = color;
    context.globalAlpha = isTransition ? 0.45 + pulse * 0.2 : 0.82;
    context.lineWidth = isTransition ? 1.5 : 2;
    context.stroke();
    context.beginPath();
    context.arc(marker.point.left, marker.point.top, isTransition ? 2.5 : 2, 0, Math.PI * 2);
    context.fillStyle = color;
    context.globalAlpha = 0.92;
    context.fill();
    context.restore();
  });
};

const getPolylineLength = (points: RouteScreenPoint[]) => points.slice(1).reduce(
  (total, point, index) => total + Math.hypot(
    point.left - points[index].left,
    point.top - points[index].top
  ),
  0
);

const drawRouteWave = (
  context: CanvasRenderingContext2D,
  segments: ScreenRouteSegment[],
  timestamp: number
) => {
  const progress = (timestamp % WAVE_CYCLE_MS) / WAVE_CYCLE_MS;
  const opacity = Math.pow(Math.sin(Math.PI * progress), 0.5) * 0.4;
  context.save();
  context.globalAlpha = opacity;
  context.globalCompositeOperation = 'screen';
  context.lineWidth = 4;
  context.lineCap = 'round';
  context.lineJoin = 'round';
  context.shadowColor = ROUTE_COLORS.glow;
  context.shadowBlur = 3;

  segments.forEach((segment) => {
    const first = segment.points[0];
    const last = segment.points.at(-1);
    if (!first || !last) return;

    const gradient = context.createLinearGradient(first.left, first.top, last.left, last.top);
    addWaveGradientStops(gradient, progress, ROUTE_COLORS.glow);
    context.strokeStyle = gradient;
    strokePolyline(context, segment.points);
  });
  context.restore();
};

const addWaveGradientStops = (
  gradient: CanvasGradient,
  center: number,
  color: string
) => {
  const start = Math.max(0, center - WAVE_HALF_WIDTH);
  const end = Math.min(1, center + WAVE_HALF_WIDTH);
  gradient.addColorStop(0, 'transparent');
  gradient.addColorStop(start, 'transparent');
  gradient.addColorStop(center, color);
  gradient.addColorStop(end, 'transparent');
  gradient.addColorStop(1, 'transparent');
};

const drawPartialSegments = (
  context: CanvasRenderingContext2D,
  segments: ScreenRouteSegment[],
  visibleLength: number,
  color: string,
  width: number,
  opacity: number,
  blur = 0
) => {
  let remainingLength = visibleLength;
  context.save();
  context.strokeStyle = color;
  context.globalAlpha = opacity;
  context.lineWidth = width;
  context.lineCap = 'round';
  context.lineJoin = 'round';
  context.shadowColor = color;
  context.shadowBlur = blur;

  for (const segment of segments) {
    if (remainingLength <= 0) break;
    const segmentLength = getPolylineLength(segment.points);
    strokePolyline(context, getPartialPolyline(segment.points, remainingLength));
    remainingLength -= segmentLength;
  }

  context.restore();
};

const getPartialPolyline = (points: RouteScreenPoint[], maxLength: number) => {
  const partial = [points[0]];
  let remaining = maxLength;

  for (let index = 1; index < points.length; index += 1) {
    const previous = points[index - 1];
    const current = points[index];
    const length = Math.hypot(current.left - previous.left, current.top - previous.top);
    if (remaining >= length) {
      partial.push(current);
      remaining -= length;
      continue;
    }

    const ratio = length > 0 ? remaining / length : 0;
    partial.push({
      left: previous.left + (current.left - previous.left) * ratio,
      top: previous.top + (current.top - previous.top) * ratio,
    });
    break;
  }

  return partial;
};

const strokePolyline = (
  context: CanvasRenderingContext2D,
  points: RouteScreenPoint[]
) => {
  if (points.length < 2) return;
  context.beginPath();
  context.moveTo(points[0].left, points[0].top);
  points.slice(1).forEach((point) => context.lineTo(point.left, point.top));
  context.stroke();
};
