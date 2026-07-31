import { themeColors } from '@/lib/theme-colors';
import type React from 'react';
import type { ManualCoords, ManualWorld } from './position-types';

interface ManualPositionInputProps {
  action?: React.ReactNode;
  coords: ManualCoords;
  readOnly?: boolean;
  world: ManualWorld;
  onCoordsChange: (coords: ManualCoords) => void;
  onWorldChange: (world: ManualWorld) => void;
}

export default function ManualPositionInput({
  action,
  coords,
  readOnly = false,
  world,
  onCoordsChange,
  onWorldChange,
}: ManualPositionInputProps) {
  return (
    <div className="flex h-full flex-col justify-evenly">
      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-1">
          <WorldButton
            active={world === 'overworld'}
            disabled={readOnly}
            onClick={() => onWorldChange('overworld')}
            tone="overworld"
          >
            overworld
          </WorldButton>
          <WorldButton
            active={world === 'nether'}
            disabled={readOnly}
            onClick={() => onWorldChange('nether')}
            tone="nether"
          >
            nether
          </WorldButton>
        </div>
        {action}
      </div>
      <div className="flex items-center gap-3">
        <CoordinateInput axis="x" label="X" placeholder="0" coords={coords} onCoordsChange={onCoordsChange} readOnly={readOnly} />
        <CoordinateInput axis="y" label="Y" placeholder="64" coords={coords} onCoordsChange={onCoordsChange} readOnly={readOnly} />
        <CoordinateInput axis="z" label="Z" placeholder="0" coords={coords} onCoordsChange={onCoordsChange} readOnly={readOnly} />
      </div>
    </div>
  );
}

function WorldButton({
  active,
  children,
  disabled = false,
  onClick,
  tone,
}: {
  active: boolean;
  children: React.ReactNode;
  disabled?: boolean;
  onClick: () => void;
  tone: ManualWorld;
}) {
  return (
    <button
      disabled={disabled}
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
  readOnly,
}: {
  axis: keyof ManualCoords;
  coords: ManualCoords;
  label: string;
  onCoordsChange: (coords: ManualCoords) => void;
  placeholder: string;
  readOnly: boolean;
}) {
  return (
    <>
      <label className={`text-xs font-medium ${themeColors.text.quaternary} w-4 text-center ${themeColors.transition}`}>{label}</label>
      <input
        type="number"
        readOnly={readOnly}
        value={coords[axis]}
        onChange={(event) => onCoordsChange({ ...coords, [axis]: event.target.value })}
        placeholder={placeholder}
        className={`w-16 px-2 py-1 text-xs ${themeColors.input.panel} border rounded focus:outline-none focus:ring-2 ${themeColors.transition} ${themeColors.placeholder} [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
      />
    </>
  );
}
