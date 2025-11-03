import { themeColors } from '@/lib/theme-colors';
import React from 'react';

const inputClass = `${themeColors.input.search} border ${themeColors.util.roundedLg} px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 ${themeColors.transition} ${themeColors.placeholder}`;

export const slugify = (value: string) => {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
};

export const parseOwners = (input: string): string[] => {
  return input
    .split(/[\n,;]+/)
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
};

export interface CoordinatesInput {
  x: string | number;
  y: string | number;
  z: string | number;
}

export const parseCoordinateTriplet = (coords: CoordinatesInput) => {
  const x = Number(coords.x);
  const y = Number(coords.y);
  const z = Number(coords.z);
  if (Number.isNaN(x) || Number.isNaN(y) || Number.isNaN(z)) {
    return null;
  }
  return { x, y, z };
};

export const parseTags = (input: string): string[] => {
  return Array.from(
    new Set(
      input
        .split(/[\n,;]+/)
        .map((entry) => entry.trim())
        .filter((entry) => entry.length > 0)
    )
  );
};

export const generateFormId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2, 10);
};

export const SubHeader: React.FC<{ title: string; description?: string }> = ({ title, description }) => (
  <div className="space-y-0.5">
    <h3 className={`text-sm font-semibold ${themeColors.text.secondary} ${themeColors.transition}`}>{title}</h3>
    {description && (
      <p className={`text-xs ${themeColors.text.quaternary}`}>{description}</p>
    )}
  </div>
);

export const renderOwnersInput = (
  value: string,
  setValue: (next: string) => void,
  placeholder = 'Doviculus22, spacenewbie'
) => (
  <div className="space-y-1">
    <label className={`text-xs font-medium ${themeColors.text.secondary}`}>Propriétaires (séparés par une virgule)</label>
    <textarea
      className={`${inputClass} resize-y min-h-[40px] leading-5`}
      placeholder={placeholder}
      value={value}
      rows={1}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
        }
      }}
      onChange={(event) => setValue(event.target.value.replace(/\n+/g, ', '))}
    />
  </div>
);

export const renderCoordinateInputs = (
  coords: CoordinatesInput,
  setCoords: React.Dispatch<React.SetStateAction<CoordinatesInput>>,
  label?: string
) => (
  <div className="space-y-1">
    {label && <label className={`text-xs font-medium ${themeColors.text.secondary}`}>{label}</label>}
    <div className="grid grid-cols-3 gap-2">
      {(['x', 'y', 'z'] as Array<keyof CoordinatesInput>).map((axis) => (
        <input
          key={axis}
          type="number"
          inputMode="numeric"
          className={inputClass}
          placeholder={axis.toUpperCase()}
          value={coords[axis]}
          onChange={(event) => setCoords((prev) => ({ ...prev, [axis]: event.target.value }))}
        />
      ))}
    </div>
  </div>
);
