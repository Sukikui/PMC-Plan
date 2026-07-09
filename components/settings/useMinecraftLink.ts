"use client";

import { useCallback, useEffect, useRef, useState } from 'react';
import type { MineVerifyPublicStatus } from '@/lib/mineverify/types';

const POLL_INTERVAL_MS = 2500;
const ACTIVE_STATUSES = new Set<MineVerifyPublicStatus['status']>(['pending', 'code_created']);

const initialStatus: MineVerifyPublicStatus = { status: 'not_started' };

export function useMinecraftLink(enabled: boolean, shouldPoll: boolean) {
  const [status, setStatus] = useState<MineVerifyPublicStatus>(initialStatus);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestInFlightRef = useRef(false);

  const refreshStatus = useCallback(async () => {
    if (!enabled) {
      setStatus(initialStatus);
      return initialStatus;
    }

    const response = await fetch('/api/minecraft-link/status', { cache: 'no-store' });

    if (!response.ok) {
      throw new Error('Impossible de récupérer le statut Minecraft.');
    }

    const nextStatus = await response.json() as MineVerifyPublicStatus;
    setStatus(nextStatus);
    setError(null);
    return nextStatus;
  }, [enabled]);

  const startRequest = useCallback(async () => {
    if (!enabled || requestInFlightRef.current || ACTIVE_STATUSES.has(status.status) || status.status === 'linked') {
      return;
    }

    requestInFlightRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/minecraft-link/request', { method: 'POST' });

      if (!response.ok) {
        throw new Error('Impossible de démarrer la liaison Minecraft.');
      }

      const nextStatus = await response.json() as MineVerifyPublicStatus;
      setStatus(nextStatus);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Erreur inconnue.');
    } finally {
      setLoading(false);
      requestInFlightRef.current = false;
    }
  }, [enabled, status.status]);

  const unlinkAccount = useCallback(async () => {
    if (!enabled || requestInFlightRef.current) {
      return;
    }

    requestInFlightRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/minecraft-link/unlink', { method: 'POST' });

      if (!response.ok) {
        throw new Error('Impossible de délier le compte Minecraft.');
      }

      const nextStatus = await response.json() as MineVerifyPublicStatus;
      setStatus(nextStatus);
    } catch (unlinkError) {
      setError(unlinkError instanceof Error ? unlinkError.message : 'Erreur inconnue.');
    } finally {
      setLoading(false);
      requestInFlightRef.current = false;
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      setStatus(initialStatus);
      setError(null);
      return;
    }

    void refreshStatus().catch((refreshError) => {
      setError(refreshError instanceof Error ? refreshError.message : 'Erreur inconnue.');
    });
  }, [enabled, refreshStatus]);

  useEffect(() => {
    if (!enabled || !shouldPoll || !ACTIVE_STATUSES.has(status.status)) {
      return;
    }

    const intervalId = window.setInterval(() => {
      void refreshStatus().catch((refreshError) => {
        setError(refreshError instanceof Error ? refreshError.message : 'Erreur inconnue.');
      });
    }, POLL_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [enabled, refreshStatus, shouldPoll, status.status]);

  return {
    status,
    loading,
    error,
    refreshStatus,
    startRequest,
    unlinkAccount,
  };
}
