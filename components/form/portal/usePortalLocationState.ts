import { useReducer, type Dispatch, type SetStateAction } from 'react';
import {
  convertNetherCoordinateFieldsToOverworld,
  convertOverworldCoordinateFieldsToNether,
} from '@/lib/nether-coordinates';
import type { MapWorld } from '@/lib/map/metadata';
import type { InitialMapPosition } from '../common/form-values';
import type { CoordinatesInput } from '../common/form-utils';
import { useNetherAddress } from '../nether/NetherAddressField';
import type { NetherCoordinatesState } from '../nether/NetherCoordinatesField';
import type { InitialPortalData, PortalVariant } from './portal-form-types';

interface PortalLocationState {
  coordinates: Record<MapWorld, CoordinatesInput>;
  netherCoordinatesManual: boolean;
  variant: PortalVariant;
}

type PortalLocationAction =
  | { type: 'set-coordinates'; world: MapWorld; value: CoordinatesInput }
  | { type: 'set-nether-manual'; manual: boolean }
  | { type: 'set-variant'; variant: PortalVariant };

const blankCoordinates = (): CoordinatesInput => ({ x: '', y: '', z: '' });

const toCoordinatesInput = (
  coordinates: { x: number; y?: number; z: number },
): CoordinatesInput => ({
  x: String(coordinates.x),
  y: coordinates.y === undefined ? '' : String(coordinates.y),
  z: String(coordinates.z),
});

export function createPortalLocationState(
  initialData?: InitialPortalData,
  initialPosition?: InitialMapPosition,
): PortalLocationState {
  if (initialData?.variant === 'linked') {
    const overworld = initialData.overworldCoordinates
      ? toCoordinatesInput(initialData.overworldCoordinates)
      : blankCoordinates();
    const automaticNether = convertOverworldCoordinateFieldsToNether(overworld);
    const nether = initialData.netherCoordinates
      ? toCoordinatesInput(initialData.netherCoordinates)
      : automaticNether;

    return {
      coordinates: { nether, overworld },
      netherCoordinatesManual: !coordinateFieldsMatch(nether, automaticNether),
      variant: 'linked',
    };
  }

  if (initialData?.coordinates) {
    return createLocationFromWorld(
      toCoordinatesInput(initialData.coordinates),
      initialData.variant,
      initialData.variant,
    );
  }

  if (initialPosition) {
    return createLocationFromWorld(
      toCoordinatesInput(initialPosition),
      initialPosition.world,
      'linked',
    );
  }

  return {
    coordinates: {
      nether: blankCoordinates(),
      overworld: blankCoordinates(),
    },
    netherCoordinatesManual: false,
    variant: 'linked',
  };
}

export function portalLocationReducer(
  state: PortalLocationState,
  action: PortalLocationAction,
): PortalLocationState {
  if (action.type === 'set-variant') {
    return { ...state, variant: action.variant };
  }

  if (action.type === 'set-nether-manual') {
    return {
      ...state,
      coordinates: action.manual
        ? state.coordinates
        : {
            ...state.coordinates,
            nether: convertOverworldCoordinateFieldsToNether(
              state.coordinates.overworld,
            ),
          },
      netherCoordinatesManual: action.manual,
    };
  }

  if (state.variant !== 'linked') {
    return createLocationFromWorld(action.value, action.world, state.variant);
  }

  if (action.world === 'overworld') {
    return {
      ...state,
      coordinates: {
        overworld: action.value,
        nether: state.netherCoordinatesManual
          ? state.coordinates.nether
          : convertOverworldCoordinateFieldsToNether(action.value),
      },
    };
  }

  if (!state.netherCoordinatesManual) {
    return {
      ...state,
      coordinates: {
        nether: action.value,
        overworld: convertNetherCoordinateFieldsToOverworld(action.value),
      },
    };
  }

  return {
    ...state,
    coordinates: { ...state.coordinates, nether: action.value },
  };
}

export function usePortalLocationState(
  initialData?: InitialPortalData,
  initialPosition?: InitialMapPosition,
) {
  const [location, dispatch] = useReducer(
    portalLocationReducer,
    undefined,
    () => createPortalLocationState(initialData, initialPosition),
  );
  const netherAddress = useNetherAddress({
    enabled: location.variant !== 'overworld',
    coords: location.coordinates.nether,
    initialValue: initialData?.variant === 'nether'
      ? initialData.address
      : initialData?.netherAddress,
    preserveWhenDisabled: true,
  });

  const setCoordinates = (
    world: MapWorld,
  ): Dispatch<SetStateAction<CoordinatesInput>> => (nextValue) => {
    const current = location.coordinates[world];
    const value = typeof nextValue === 'function'
      ? nextValue(current)
      : nextValue;
    dispatch({ type: 'set-coordinates', value, world });

    if (world === 'overworld' && location.variant === 'overworld') {
      netherAddress.setValue('');
      netherAddress.setManual(false);
    }
  };

  const netherCoordinates: NetherCoordinatesState = {
    manual: location.netherCoordinatesManual,
    setManual: (manual) => dispatch({ type: 'set-nether-manual', manual }),
    setValue: setCoordinates('nether'),
    value: location.coordinates.nether,
  };

  return {
    netherAddress,
    netherCoordinates,
    overworldCoords: location.coordinates.overworld,
    portalVariant: location.variant,
    setNetherCoords: setCoordinates('nether'),
    setOverworldCoords: setCoordinates('overworld'),
    setPortalVariant: (variant: PortalVariant) => {
      dispatch({ type: 'set-variant', variant });
    },
  };
}

function createLocationFromWorld(
  coordinates: CoordinatesInput,
  world: MapWorld,
  variant: PortalVariant,
): PortalLocationState {
  const pair = world === 'overworld'
    ? {
        nether: convertOverworldCoordinateFieldsToNether(coordinates),
        overworld: coordinates,
      }
    : {
        nether: coordinates,
        overworld: convertNetherCoordinateFieldsToOverworld(coordinates),
      };
  const automaticNether = convertOverworldCoordinateFieldsToNether(
    pair.overworld,
  );

  return {
    coordinates: pair,
    netherCoordinatesManual: !coordinateFieldsMatch(
      pair.nether,
      automaticNether,
    ),
    variant,
  };
}

function coordinateFieldsMatch(
  left: CoordinatesInput,
  right: CoordinatesInput,
) {
  return (['x', 'y', 'z'] as const).every((axis) => {
    const leftValue = String(left[axis]).trim();
    const rightValue = String(right[axis]).trim();
    if (!leftValue || !rightValue) return leftValue === rightValue;

    const leftNumber = Number(leftValue);
    const rightNumber = Number(rightValue);
    return Number.isFinite(leftNumber) && Number.isFinite(rightNumber)
      ? leftNumber === rightNumber
      : leftValue === rightValue;
  });
}
