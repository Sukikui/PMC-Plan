import type { MapCoordinate } from '@/lib/map/metadata';

export interface MapLineOverlay {
  id: string;
  points: MapCoordinate[];
  strokeStyle: string;
  strokeOpacity?: number;
  widthBlocks: number;
}
