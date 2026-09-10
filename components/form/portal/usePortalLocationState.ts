import { useState } from 'react';
import type { InitialMapPosition } from '../common/form-values';
import type { CoordinatesInput } from '../common/form-utils';
import { useNetherAddress } from '../nether/NetherAddressField';
import { useNetherCoordinates } from '../nether/NetherCoordinatesField';
import type { InitialPortalData } from './portal-form-types';

const blankCoordinates = (): CoordinatesInput => ({ x: '', y: '', z: '' });

const toCoordinatesInput = (
  coordinates: { x: number; y?: number; z: number },
): CoordinatesInput => ({
  x: String(coordinates.x),
  y: coordinates.y === undefined ? '' : String(coordinates.y),
  z: String(coordinates.z),
});

export function usePortalLocationState(
  initialData?: InitialPortalData,
  initialPosition?: InitialMapPosition,
) {
  const [portalVariant, setPortalVariant] = useState(
    initialData?.variant ?? initialPosition?.world ?? 'linked',
  );
  const [singleCoords, setSingleCoords] = useState<CoordinatesInput>(() => (
    initialData?.coordinates
      ? toCoordinatesInput(initialData.coordinates)
      : initialPosition
        ? toCoordinatesInput(initialPosition)
        : blankCoordinates()
  ));
  const [overworldCoords, setOverworldCoords] = useState<CoordinatesInput>(() => (
    initialData?.overworldCoordinates
      ? toCoordinatesInput(initialData.overworldCoordinates)
      : initialPosition?.world === 'overworld'
        ? toCoordinatesInput(initialPosition)
        : blankCoordinates()
  ));
  const netherCoordinates = useNetherCoordinates({
    initialValue: initialData?.netherCoordinates
      ?? (initialPosition?.world === 'nether' ? initialPosition : undefined),
    overworldCoordinates: overworldCoords,
  });
  const singleAddress = useNetherAddress({
    enabled: portalVariant === 'nether',
    coords: singleCoords,
    initialValue: initialData?.address,
  });
  const netherAddress = useNetherAddress({
    enabled: portalVariant === 'linked',
    coords: netherCoordinates.value,
    initialValue: initialData?.netherAddress,
  });

  return {
    netherAddress,
    netherCoordinates,
    overworldCoords,
    portalVariant,
    setOverworldCoords,
    setPortalVariant,
    setSingleCoords,
    singleAddress,
    singleCoords,
  };
}
