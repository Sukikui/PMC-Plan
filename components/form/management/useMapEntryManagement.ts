'use client';

import { useCallback, useEffect, useState } from 'react';
import type { MapEntryManagement } from '@/lib/map-entry/types';

export function useMapEntryManagement(mapEntryId?: string) {
  const [management, setManagement] = useState<MapEntryManagement | null>(null);
  const [loading, setLoading] = useState(Boolean(mapEntryId));
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!mapEntryId) return;
    setManagement(null);
    setLoading(true);
    try {
      const response = await fetch(`/api/map-entries/${mapEntryId}/management`, {
        cache: 'no-store',
      });
      setManagement(await readManagementResponse(response));
      setError(null);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, [mapEntryId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    management,
    loading,
    error,
  };
}

async function readManagementResponse(response: Response) {
  const payload = await response.json().catch(() => ({})) as {
    error?: string;
  } & Partial<MapEntryManagement>;
  if (!response.ok) {
    throw new Error(payload.error || 'Impossible de charger la gestion de cette fiche.');
  }
  return payload as MapEntryManagement;
}

const getErrorMessage = (error: unknown) => (
  error instanceof Error ? error.message : 'Une erreur inattendue est survenue.'
);
