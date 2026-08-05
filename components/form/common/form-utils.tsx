import { themeColors } from '@/lib/theme-colors';
import React from 'react';
import { formFieldLabelClassName, formInputClassName } from './form-styles';
import {
  type CoordinatesInput,
} from './form-values';

export {
  generateFormId,
  parseCoordinateTriplet,
  slugify,
  type CoordinatesInput,
} from './form-values';

export const suggestionDropdownClass = `absolute left-0 right-0 z-20 mt-2 overflow-hidden border ${themeColors.panel.primary} ${themeColors.blurSm} ${themeColors.border.primary} ${themeColors.util.roundedLg} ${themeColors.shadow.panel}`;

export const suggestionOptionClass = `w-full text-left ${themeColors.transition} ${themeColors.interactive.hoverPanel}`;

export const renderCoordinateInputs = (
  coords: CoordinatesInput,
  setCoords: React.Dispatch<React.SetStateAction<CoordinatesInput>>,
  label?: string
) => (
  <div className="space-y-1">
    {label && <label className={formFieldLabelClassName}>{label}</label>}
    <div className="grid grid-cols-3 gap-2">
      {(['x', 'y', 'z'] as Array<keyof CoordinatesInput>).map((axis) => (
        <input
          key={axis}
          type="number"
          inputMode="numeric"
          className={formInputClassName}
          placeholder={axis.toUpperCase()}
          value={coords[axis]}
          onChange={(event) => setCoords((prev) => ({ ...prev, [axis]: event.target.value }))}
        />
      ))}
    </div>
  </div>
);
