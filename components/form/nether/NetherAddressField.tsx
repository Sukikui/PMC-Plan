'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { themeColors } from '@/lib/theme-colors';
import { CoordinatesInput, parseCoordinateTriplet } from '../common/form-utils';

const inputClass = `${themeColors.input.search} border ${themeColors.util.roundedLg} px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 ${themeColors.transition} ${themeColors.placeholder}`;

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

    const parsedCoords = parseCoordinateTriplet(coords);
    if (!parsedCoords) {
      setError('Coordonnées invalides');
      return;
    }

    setManual(false);
    requestAddress(parsedCoords);
  }, [coords, enabled, requestAddress]);

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

    const parsedCoords = parseCoordinateTriplet(coords);
    if (!parsedCoords) {
      requestId.current += 1;
      setLoading(false);
      setError(null);
      return;
    }

    requestAddress(parsedCoords);
  }, [coords, enabled, manual, requestAddress]);

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
      <label className={`text-xs font-medium ${themeColors.text.secondary}`}>{label}</label>
      <input
        className={`${inputClass} ${address.manual ? '' : 'cursor-not-allowed opacity-70'}`}
        placeholder="Adresse suggérée"
        value={address.value}
        onChange={(event) => address.setValue(event.target.value)}
        disabled={!address.manual}
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => {
            if (address.manual) {
              address.setManual(false);
            }
            address.recompute();
          }}
          className={`${themeColors.toggle.compactBase} ${
            !address.manual
              ? themeColors.toggle.activeBlue
              : themeColors.toggle.inactive
          }`}
        >
          Automatique
        </button>
        <button
          type="button"
          onClick={() => address.setManual(true)}
          className={`${themeColors.toggle.compactBase} ${
            address.manual
              ? themeColors.toggle.activeBlue
              : themeColors.toggle.inactive
          }`}
        >
          Manuel
        </button>
      </div>
      <div className="flex items-center gap-2 text-xs">
        {address.loading && <span className={themeColors.text.tertiary}>Calcul de l&#39;adresse…</span>}
        {address.error && <span className={themeColors.feedback.errorText}>{address.error}</span>}
      </div>
    </div>
  );
}
