import type { MapLineOverlay } from '@/lib/map/overlays';
import {
  NETHER_AXIS_LINE_WIDTH_BLOCKS,
  netherAxisPolylines,
} from '@/lib/nether/network-data';

export const netherAxisLineOverlays: Array<Omit<MapLineOverlay, 'strokeStyle'>> =
  netherAxisPolylines.map(({ id, points }) => ({
    id,
    points: points.map(({ x, z }) => ({ x, z })),
    widthBlocks: NETHER_AXIS_LINE_WIDTH_BLOCKS,
  }));
