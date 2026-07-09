import { OVERWORLD_MAP_WORLD, type MapWorld } from '@/lib/map/metadata';

export type DestinationType = 'place' | 'portal';

export type SelectDestinationHandler = (
  id: string,
  type: DestinationType,
  world?: MapWorld
) => void;

export const toMapWorld = (world: string): MapWorld => (
  world === 'nether' ? 'nether' : OVERWORLD_MAP_WORLD
);
