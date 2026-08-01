import { themeColors } from '@/lib/theme-colors';
import type { MapWorld } from '@/lib/map/metadata';
import type { MapViewport } from '../core/map-view';

const HALO_VISIBILITY_MARGIN_PX = 64;

interface MapEdgeHaloProps {
  bounds: {
    left: number;
    top: number;
    width: number;
    height: number;
  };
  viewport: MapViewport;
  world: MapWorld;
}

export default function MapEdgeHalo({ bounds, viewport, world }: MapEdgeHaloProps) {
  if (!hasVisibleMapEdge(bounds, viewport)) return null;

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute z-10 ${themeColors.map.edgeHalo[world]}`}
      style={bounds}
    />
  );
}

const hasVisibleMapEdge = (
  bounds: MapEdgeHaloProps['bounds'],
  viewport: MapViewport
) => {
  const right = bounds.left + bounds.width;
  const bottom = bounds.top + bounds.height;
  const isVisible = (position: number, size: number) => (
    position >= -HALO_VISIBILITY_MARGIN_PX
    && position <= size + HALO_VISIBILITY_MARGIN_PX
  );

  return isVisible(bounds.left, viewport.width)
    || isVisible(right, viewport.width)
    || isVisible(bounds.top, viewport.height)
    || isVisible(bottom, viewport.height);
};
