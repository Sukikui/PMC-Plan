'use client';

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import CompactChoiceGroup, { automaticModeOptions } from '../common/CompactChoiceGroup';
import { themeColors } from '@/lib/theme-colors';
import { CoordinatesInput, parseCoordinateTriplet } from '../common/form-utils';
import {
  formFieldLabelClassName,
  formInputClassName,
} from '../common/form-styles';

interface UseNetherAddressOptions {
  enabled: boolean;
  coords: CoordinatesInput;
  initialValue?: string | null;
}

export interface NetherAddressState {
  value: string;
  setValue: React.Dispatch<React.SetStateAction<string>>;
  manual: boolean;
  setManual: React.Dispatch<React.SetStateAction<boolean>>;
  loading: boolean;
  error: string | null;
  recompute: () => void;
}

export function useNetherAddress({ enabled, coords, initialValue }: UseNetherAddressOptions): NetherAddressState {
  const initialAddress = initialValue ?? '';
  const [value, setValue] = useState(initialAddress);
  const [manual, setManual] = useState(Boolean(initialAddress));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);
  const { x, y, z } = coords;
  const parsedCoords = useMemo(
    () => parseCoordinateTriplet({ x, y, z }),
    [x, y, z],
  );

  const requestAddress = useCallback(async (parsedCoords: { x: number; y: number; z: number }) => {
    requestId.current += 1;
    const currentId = requestId.current;

    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        x: parsedCoords.x.toString(),
        y: parsedCoords.y.toString(),
        z: parsedCoords.z.toString(),
      });
      const response = await fetch(`/api/nether-address?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Erreur lors du calcul de l\'adresse');
      }

      const data = await response.json();
      if (requestId.current === currentId) {
        setValue(data.address ?? '');
      }
    } catch (requestError: unknown) {
      if (requestId.current === currentId) {
        setError(requestError instanceof Error ? requestError.message : 'Adresse indisponible');
      }
    } finally {
      if (requestId.current === currentId) {
        setLoading(false);
      }
    }
  }, []);

  const recompute = useCallback(() => {
    if (!enabled) {
      return;
    }

    if (!parsedCoords) {
      setError('Coordonnées invalides');
      return;
    }

    setManual(false);
    requestAddress(parsedCoords);
  }, [enabled, parsedCoords, requestAddress]);

  useEffect(() => {
    if (!enabled) {
      requestId.current += 1;
      setValue('');
      setManual(false);
      setLoading(false);
      setError(null);
      return;
    }

    if (manual) {
      return;
    }

    if (!parsedCoords) {
      requestId.current += 1;
      setLoading(false);
      setError(null);
      return;
    }

    requestAddress(parsedCoords);
  }, [enabled, manual, parsedCoords, requestAddress]);

  return {
    value,
    setValue,
    manual,
    setManual,
    loading,
    error,
    recompute,
  };
}

interface NetherAddressFieldProps {
  label: string;
  address: NetherAddressState;
}

export function NetherAddressField({ label, address }: NetherAddressFieldProps) {
  return (
    <div className="space-y-2">
      <label className={formFieldLabelClassName}>{label}</label>
      <input
        className={`${formInputClassName} ${address.manual ? '' : 'cursor-not-allowed opacity-70'}`}
        placeholder="Adresse suggérée"
        value={address.value}
        onChange={(event) => address.setValue(event.target.value)}
        disabled={!address.manual}
      />
      <CompactChoiceGroup
        ariaLabel="Mode de saisie de l’adresse Nether"
        onChange={(value) => {
          const manual = value === 'manual';
          address.setManual(manual);
          if (!manual) address.recompute();
        }}
        options={automaticModeOptions}
        value={address.manual ? 'manual' : 'automatic'}
      />
      <div className="flex items-center gap-2 text-xs">
        {address.loading && <span className={themeColors.text.tertiary}>Calcul de l&#39;adresse…</span>}
        {address.error && <span className={themeColors.feedback.errorText}>{address.error}</span>}
      </div>
    </div>
  );
}
