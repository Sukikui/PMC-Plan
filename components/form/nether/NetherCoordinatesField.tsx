'use client';

import type { Dispatch, SetStateAction } from 'react';
import CompactChoiceGroup, {
  automaticModeOptions,
} from '../common/CompactChoiceGroup';
import {
  renderCoordinateInputs,
  type CoordinatesInput,
} from '../common/form-utils';

export interface NetherCoordinatesState {
  manual: boolean;
  setManual: (manual: boolean) => void;
  setValue: Dispatch<SetStateAction<CoordinatesInput>>;
  value: CoordinatesInput;
}

export function NetherCoordinatesField({
  coordinates,
}: {
  coordinates: NetherCoordinatesState;
}) {
  return (
    <div className="space-y-2">
      {renderCoordinateInputs(
        coordinates.value,
        coordinates.setValue,
        'Coordonnées nether',
      )}
      <CompactChoiceGroup
        ariaLabel="Mode de saisie des coordonnées Nether"
        onChange={(value) => coordinates.setManual(value === 'manual')}
        options={automaticModeOptions}
        value={coordinates.manual ? 'manual' : 'automatic'}
      />
    </div>
  );
}
