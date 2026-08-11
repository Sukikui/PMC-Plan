'use client';

import { useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import { convertOverworldCoordinatesToNether } from '@/lib/nether-coordinates';
import CompactChoiceGroup, {
  automaticModeOptions,
} from '../common/CompactChoiceGroup';
import {
  parseCoordinateTriplet,
  renderCoordinateInputs,
  type CoordinatesInput,
} from '../common/form-utils';

interface UseNetherCoordinatesOptions {
  initialValue?: { x: number; y: number; z: number };
  overworldCoordinates: CoordinatesInput;
}

export interface NetherCoordinatesState {
  manual: boolean;
  setManual: (manual: boolean) => void;
  setValue: Dispatch<SetStateAction<CoordinatesInput>>;
  value: CoordinatesInput;
}

export function useNetherCoordinates({
  initialValue,
  overworldCoordinates,
}: UseNetherCoordinatesOptions): NetherCoordinatesState {
  const { x, y, z } = overworldCoordinates;
  const automaticValue = useMemo(
    () => deriveNetherCoordinates({ x, y, z }),
    [x, y, z],
  );
  const [manualValue, setManualValue] = useState<CoordinatesInput>(() => (
    initialValue ? stringifyCoordinates(initialValue) : blankCoordinates()
  ));
  const [manual, setManualState] = useState(() => Boolean(
    initialValue && !coordinatesMatch(stringifyCoordinates(initialValue), automaticValue),
  ));

  const setManual = (nextManual: boolean) => {
    if (nextManual && !manual) setManualValue(automaticValue);
    setManualState(nextManual);
  };

  return {
    manual,
    setManual,
    setValue: setManualValue,
    value: manual ? manualValue : automaticValue,
  };
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
        !coordinates.manual,
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

const deriveNetherCoordinates = (coordinates: CoordinatesInput): CoordinatesInput => {
  const x = parseCoordinate(coordinates.x);
  const y = parseCoordinate(coordinates.y);
  const z = parseCoordinate(coordinates.z);
  const converted = convertOverworldCoordinatesToNether({
    x: x ?? 0,
    y: y ?? 0,
    z: z ?? 0,
  });

  return {
    x: x === null ? '' : String(converted.x),
    y: y === null ? '' : String(converted.y),
    z: z === null ? '' : String(converted.z),
  };
};

const parseCoordinate = (value: string | number) => {
  const normalized = String(value).trim();
  if (!normalized) return null;

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
};

const stringifyCoordinates = (
  coordinates: { x: number; y: number; z: number },
): CoordinatesInput => ({
  x: String(coordinates.x),
  y: String(coordinates.y),
  z: String(coordinates.z),
});

const coordinatesMatch = (left: CoordinatesInput, right: CoordinatesInput) => {
  const parsedLeft = parseCoordinateTriplet(left);
  const parsedRight = parseCoordinateTriplet(right);
  return Boolean(
    parsedLeft
    && parsedRight
    && parsedLeft.x === parsedRight.x
    && parsedLeft.y === parsedRight.y
    && parsedLeft.z === parsedRight.z
  );
};

const blankCoordinates = (): CoordinatesInput => ({ x: '', y: '', z: '' });
