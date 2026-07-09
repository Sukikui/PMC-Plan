import type React from 'react';
import { themeColors } from '@/lib/theme-colors';
import { renderCoordinateInputs, type CoordinatesInput } from '../common/form-utils';
import { NetherAddressField, useNetherAddress } from '../nether/NetherAddressField';

interface PlaceWorldFieldsProps {
  address: ReturnType<typeof useNetherAddress>;
  coords: CoordinatesInput;
  setCoords: React.Dispatch<React.SetStateAction<CoordinatesInput>>;
  world: 'overworld' | 'nether';
  setWorld: (world: 'overworld' | 'nether') => void;
}

export default function PlaceWorldFields({
  address,
  coords,
  setCoords,
  world,
  setWorld,
}: PlaceWorldFieldsProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-start md:gap-3">
        <div className="space-y-1 md:mr-3">
          <label className={`text-xs font-medium ${themeColors.text.secondary}`}>Monde</label>
          <div className="flex gap-1">
            <WorldButton active={world === 'overworld'} onClick={() => setWorld('overworld')} tone="overworld">
              overworld
            </WorldButton>
            <WorldButton active={world === 'nether'} onClick={() => setWorld('nether')} tone="nether">
              nether
            </WorldButton>
          </div>
        </div>
        <div className="flex-1">
          {renderCoordinateInputs(coords, setCoords, 'Coordonnées du lieu')}
        </div>
      </div>
      {world === 'nether' && (
        <NetherAddressField address={address} label="Adresse dans le nether" />
      )}
    </div>
  );
}

function WorldButton({
  active,
  children,
  onClick,
  tone,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
  tone: 'overworld' | 'nether';
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 text-sm ${themeColors.util.roundedFull} font-medium ${themeColors.transition} ${
        active ? themeColors.world[tone] : `${themeColors.button.ghost} ${themeColors.interactive.hover}`
      }`}
    >
      {children}
    </button>
  );
}
