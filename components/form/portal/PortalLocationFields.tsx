import {
  renderCoordinateInputs,
  type CoordinatesInput,
} from '../common/form-utils';
import type { Dispatch, SetStateAction } from 'react';
import {
  NetherAddressField,
  type NetherAddressState,
} from '../nether/NetherAddressField';
import {
  NetherCoordinatesField,
  type NetherCoordinatesState,
} from '../nether/NetherCoordinatesField';
import type { PortalVariant } from './portal-form-types';

interface PortalLocationFieldsProps {
  netherAddress: NetherAddressState;
  netherCoordinates: NetherCoordinatesState;
  overworldCoordinates: CoordinatesInput;
  setNetherCoordinates: Dispatch<SetStateAction<CoordinatesInput>>;
  setOverworldCoordinates: Dispatch<SetStateAction<CoordinatesInput>>;
  variant: PortalVariant;
}

const NETHER_ADDRESS_LABEL = 'Adresse dans le nether';

export default function PortalLocationFields({
  netherAddress,
  netherCoordinates,
  overworldCoordinates,
  setNetherCoordinates,
  setOverworldCoordinates,
  variant,
}: PortalLocationFieldsProps) {
  if (variant === 'linked') {
    return (
      <div className="space-y-4">
        {renderCoordinateInputs(
          overworldCoordinates,
          setOverworldCoordinates,
          'Coordonnées overworld',
        )}
        <div className="space-y-3">
          <NetherCoordinatesField coordinates={netherCoordinates} />
          <NetherAddressField
            address={netherAddress}
            label={NETHER_ADDRESS_LABEL}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {renderCoordinateInputs(
          variant === 'nether' ? netherCoordinates.value : overworldCoordinates,
          variant === 'nether' ? setNetherCoordinates : setOverworldCoordinates,
          `Coordonnées ${variant}`,
        )}
      </div>
      {variant === 'nether' && (
        <NetherAddressField
          address={netherAddress}
          label={NETHER_ADDRESS_LABEL}
        />
      )}
    </div>
  );
}
