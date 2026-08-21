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

interface PortalLocationFieldsProps {
  netherAddress: NetherAddressState;
  netherCoordinates: NetherCoordinatesState;
  overworldCoordinates: CoordinatesInput;
  setOverworldCoordinates: Dispatch<SetStateAction<CoordinatesInput>>;
  setSingleCoordinates: Dispatch<SetStateAction<CoordinatesInput>>;
  singleAddress: NetherAddressState;
  singleCoordinates: CoordinatesInput;
  variant: 'overworld' | 'nether' | 'linked';
}

const NETHER_ADDRESS_LABEL = 'Adresse dans le nether';

export default function PortalLocationFields({
  netherAddress,
  netherCoordinates,
  overworldCoordinates,
  setOverworldCoordinates,
  setSingleCoordinates,
  singleAddress,
  singleCoordinates,
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
          singleCoordinates,
          setSingleCoordinates,
          `Coordonnées ${variant}`,
        )}
      </div>
      {variant === 'nether' && (
        <NetherAddressField
          address={singleAddress}
          label={NETHER_ADDRESS_LABEL}
        />
      )}
    </div>
  );
}
