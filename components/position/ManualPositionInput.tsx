import { themeColors } from '@/lib/theme-colors';
import type React from 'react';
import type { ManualCoords, ManualWorld } from './position-types';

interface ManualPositionInputProps {
  coords: ManualCoords;
  world: ManualWorld;
  onCoordsChange: (coords: ManualCoords) => void;
  onWorldChange: (world: ManualWorld) => void;
}

export default function ManualPositionInput({
  coords,
  world,
  onCoordsChange,
  onWorldChange,
}: ManualPositionInputProps) {
  return (
    <div className="space-y-4">
      <div className="flex gap-1">
        <WorldButton active={world === 'overworld'} onClick={() => onWorldChange('overworld')} tone="overworld">
          overworld
        </WorldButton>
        <WorldButton active={world === 'nether'} onClick={() => onWorldChange('nether')} tone="nether">
          nether
        </WorldButton>
      </div>
      <div className="flex items-center gap-3">
        <CoordinateInput axis="x" label="X" placeholder="0" coords={coords} onCoordsChange={onCoordsChange} />
        <CoordinateInput axis="y" label="Y" placeholder="64" coords={coords} onCoordsChange={onCoordsChange} />
        <CoordinateInput axis="z" label="Z" placeholder="0" coords={coords} onCoordsChange={onCoordsChange} trailing />
      </div>
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
  tone: ManualWorld;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-2 py-1 text-xs ${themeColors.util.roundedFull} font-medium ${themeColors.transition} ${
        active ? themeColors.world[tone] : `${themeColors.button.ghost} ${themeColors.interactive.hover}`
      }`}
    >
      {children}
    </button>
  );
}

function CoordinateInput({
  axis,
  coords,
  label,
  onCoordsChange,
  placeholder,
  trailing = false,
}: {
  axis: keyof ManualCoords;
  coords: ManualCoords;
  label: string;
  onCoordsChange: (coords: ManualCoords) => void;
  placeholder: string;
  trailing?: boolean;
}) {
  return (
    <>
      <label className={`text-xs font-medium ${themeColors.text.quaternary} w-4 text-center ${themeColors.transition}`}>{label}</label>
      <input
        type="number"
        value={coords[axis]}
        onChange={(event) => onCoordsChange({ ...coords, [axis]: event.target.value })}
        placeholder={placeholder}
        className={`w-16 px-2 py-1 text-xs ${themeColors.input.base} border rounded focus:outline-none focus:ring-2 ${themeColors.transition} ${themeColors.placeholder} [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${trailing ? 'mr-3' : ''}`}
      />
    </>
  );
}
