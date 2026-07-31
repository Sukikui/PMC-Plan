import { themeColors } from '@/lib/theme-colors';
import type { MapWorld } from '@/lib/map/metadata';

interface MapEdgeHaloProps {
  bounds: {
    left: number;
    top: number;
    width: number;
    height: number;
  };
  world: MapWorld;
}

export default function MapEdgeHalo({ bounds, world }: MapEdgeHaloProps) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute z-10 ${themeColors.map.edgeHalo[world]}`}
      style={bounds}
    />
  );
}
