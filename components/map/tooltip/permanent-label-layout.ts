import type { MapTooltipRect } from './map-tooltip-layout';

interface LabelCandidate {
  id: string;
  x: number;
  y: number;
  offset: number;
  width: number;
  height: number;
  radius?: number;
  priority?: boolean;
}

export interface CompactLabelCandidate {
  id: string;
  x: number;
  y: number;
  offset: number;
  width: number;
  height: number;
}

export interface CompactLabelPosition {
  left: number;
  top: number;
  transform: string;
  visibility: 'visible';
}

const GAP = 6;
const POINT_EDGE_MARGIN_PX = 4;
const ZONE_HEIGHT = 36;
const STEP = 12;
const COMPACT_LABEL_LIMIT = 10;
const COMPACT_LABEL_GAP_PX = 3;
const COMPACT_LABEL_HORIZONTAL_SHIFTS_PX = [0, -24, 24];
const COMPACT_LABEL_VERTICAL_SHIFTS_PX = [0, 8, 16];

const clamp = (value: number, minimum: number, maximum: number) => (
  Math.max(minimum, Math.min(value, maximum))
);

export function layoutCompactLabels(
  labels: readonly CompactLabelCandidate[],
  bounds: MapTooltipRect,
): Map<string, CompactLabelPosition> {
  const placed = new Map<string, CompactLabelPosition>();
  const occupied: MapTooltipRect[] = [];
  const centerX = (bounds.left + bounds.right) / 2;
  const centerY = (bounds.top + bounds.bottom) / 2;
  const ordered = [...labels].sort((first, second) => (
    Math.hypot(first.x - centerX, first.y - centerY)
    - Math.hypot(second.x - centerX, second.y - centerY)
    || first.id.localeCompare(second.id)
  ));
  for (const label of ordered) {
    const { width, height } = label;
    if (width <= 0 || height <= 0 || width > bounds.right - bounds.left) continue;
    const candidates = [-1, 1].flatMap((side) => (
      COMPACT_LABEL_VERTICAL_SHIFTS_PX.flatMap((distance) => (
        COMPACT_LABEL_HORIZONTAL_SHIFTS_PX.map((horizontalShift) => {
          const left = clamp(
            label.x - width / 2 + horizontalShift,
            bounds.left,
            bounds.right - width,
          );
          const top = side < 0
            ? label.y - label.offset - height - distance
            : label.y + label.offset + distance;
          return {
            rect: { left, right: left + width, top, bottom: top + height },
            style: {
              left: left + width / 2,
              top: side < 0 ? top + height : top,
              transform: side < 0 ? 'translate3d(-50%, -100%, 0)' : 'translate3d(-50%, 0, 0)',
              visibility: 'visible' as const,
            },
          };
        })
      ))
    ));
    const position = candidates.find(({ rect }) => within(rect, bounds)
      && occupied.every((other) => !overlaps(rect, other, COMPACT_LABEL_GAP_PX)));
    if (!position) continue;
    placed.set(label.id, position.style);
    occupied.push(position.rect);
    if (placed.size === COMPACT_LABEL_LIMIT) break;
  }
  return placed;
}

const overlaps = (a: MapTooltipRect, b: MapTooltipRect, gap = GAP) => (
  a.left < b.right + gap && a.right > b.left - gap
  && a.top < b.bottom + gap && a.bottom > b.top - gap
);

const within = (rect: MapTooltipRect, bounds: MapTooltipRect) => (
  rect.left >= bounds.left && rect.right <= bounds.right
  && rect.top >= bounds.top && rect.bottom <= bounds.bottom
);

const clampRect = (rect: MapTooltipRect, bounds: MapTooltipRect): MapTooltipRect => {
  const width = rect.right - rect.left;
  const height = rect.bottom - rect.top;
  const left = Math.max(bounds.left, Math.min(rect.left, bounds.right - width));
  const top = Math.max(bounds.top, Math.min(rect.top, bounds.bottom - height));
  return { left, right: left + width, top, bottom: top + height };
};

const pointVisibleInsideBounds = (label: LabelCandidate, bounds: MapTooltipRect) => (
  label.x > bounds.left + POINT_EDGE_MARGIN_PX
  && label.x < bounds.right - POINT_EDGE_MARGIN_PX
  && label.y > bounds.top + POINT_EDGE_MARGIN_PX
  && label.y < bounds.bottom - POINT_EDGE_MARGIN_PX
);

// Retained rectangles are relative to their point, so panning only translates them.
export function layoutPermanentLabels(
  labels: readonly LabelCandidate[],
  bounds: MapTooltipRect,
  obstacles: readonly MapTooltipRect[] = [],
  retained: ReadonlyMap<string, MapTooltipRect> = new Map(),
): Map<string, MapTooltipRect> {
  const placed = new Map<string, MapTooltipRect>();
  const occupied = [...obstacles];
  const pointRects = labels.map(({ x, y, radius = 4 }) => ({
    left: x - radius, right: x + radius, top: y - radius, bottom: y + radius,
  }));
  const clear = (rect: MapTooltipRect) => !occupied.some((other) => overlaps(rect, other))
    && !pointRects.some((point) => overlaps(rect, point, 2));
  const prioritized = [...labels].sort((a, b) => Number(Boolean(b.priority)) - Number(Boolean(a.priority)));
  for (const label of prioritized) {
    const saved = retained.get(label.id);
    if (!saved || !pointVisibleInsideBounds(label, bounds)) continue;
    const translated = { left: saved.left + label.x, right: saved.right + label.x,
      top: saved.top + label.y, bottom: saved.bottom + label.y };
    const candidates = [0, -STEP, STEP, -STEP * 2, STEP * 2, -STEP * 3, STEP * 3]
      .map((shift) => clampRect({
        left: translated.left, right: translated.right,
        top: translated.top + shift, bottom: translated.bottom + shift,
      }, bounds));
    const position = candidates.find(clear);
    if (!position) continue;
    placed.set(label.id, position);
    occupied.push(position);
  }
  const ordered = [...labels].sort((a, b) => (
    Number(Boolean(b.priority)) - Number(Boolean(a.priority))
    || a.y - b.y || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)
  ));
  for (const label of ordered) {
    if (retained.has(label.id)) continue;
    if (label.width <= 0 || label.height <= 0 || label.width > bounds.right - bounds.left) continue;
    const left = Math.max(bounds.left, Math.min(label.x - label.width / 2, bounds.right - label.width));
    let position: MapTooltipRect | undefined;
    for (const side of [-1, 1]) {
      for (let distance = 0; distance <= ZONE_HEIGHT; distance += STEP) {
        const top = side < 0
          ? label.y - label.offset - label.height - distance
          : label.y + label.offset + distance;
        const candidate = clampRect({ left, right: left + label.width, top, bottom: top + label.height }, bounds);
        if (!pointVisibleInsideBounds(label, bounds) || !within(candidate, bounds) || !clear(candidate)) continue;
        position = candidate;
        break;
      }
      if (position) break;
    }
    // Dense areas omit labels instead of overlapping or drifting away from their point.
    if (!position) continue;
    placed.set(label.id, position);
    occupied.push(position);
  }
  return placed;
}
