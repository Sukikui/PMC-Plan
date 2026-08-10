import { OVERWORLD_MAP_WORLD, type MapWorld } from '@/lib/map/metadata';

export type DestinationType = 'place' | 'portal';
export type DestinationInputSource = 'keyboard' | 'mouse';
export type DestinationActivation = 'select' | 'open-info' | 'clear-selection';

export type SelectDestinationHandler = (
  id: string,
  type: DestinationType,
  world?: MapWorld
) => void;

export const toMapWorld = (world: string): MapWorld => (
  world === 'nether' ? 'nether' : OVERWORLD_MAP_WORLD
);

export function resolveDestinationActivation(
  source: DestinationInputSource,
  selectedId: string | undefined,
  destinationId: string,
): DestinationActivation {
  if (selectedId !== destinationId) return 'select';
  return source === 'mouse' ? 'open-info' : 'clear-selection';
}
