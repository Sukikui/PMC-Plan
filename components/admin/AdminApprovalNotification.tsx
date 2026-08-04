'use client';

import { useEffect, useRef, useState } from 'react';
import { useAdminMode } from '@/components/admin/AdminModeProvider';
import { useSettingsOverlay } from '@/components/settings/SettingsOverlayProvider';
import StatusNotification from '@/components/ui/StatusNotification';
import {
  fetchAdminUsers,
  subscribeToAdminUserChanges,
} from '@/lib/admin/client';
import { isAdministrationRole } from '@/lib/admin/roles';

const PENDING_USERS_POLL_INTERVAL_MS = 60_000;

export default function AdminApprovalNotification() {
  const { effectiveRole } = useAdminMode();
  const settingsOverlay = useSettingsOverlay();
  const enabled = isAdministrationRole(effectiveRole);
  const count = usePendingApprovalCount(enabled);
  const previousCountRef = useRef<number | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!enabled) {
      previousCountRef.current = null;
      setVisible(false);
      return;
    }
    if (count === null) return;

    const previousCount = previousCountRef.current;
    if (count <= 0) {
      setVisible(false);
    } else if (previousCount === null || count > previousCount) {
      setVisible(true);
    }
    previousCountRef.current = count;
  }, [count, enabled]);

  if (!visible || !count) return null;

  const plural = count > 1;
  const openAdministration = () => {
    setVisible(false);
    settingsOverlay.open('admin');
  };

  return (
    <StatusNotification
      title={`${count} utilisateur${plural ? 's' : ''} en attente d’approbation`}
      description="Ouvre l’administration pour examiner les demandes."
      dismissAfterMs={4500}
      onClick={openAdministration}
      onClose={() => setVisible(false)}
    />
  );
}

function usePendingApprovalCount(enabled: boolean) {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    if (!enabled) {
      setCount(null);
      return;
    }

    let cancelled = false;
    let loading = false;
    let queued = false;
    let timeout: ReturnType<typeof setTimeout>;
    const controller = new AbortController();

    const schedule = () => {
      timeout = setTimeout(refresh, PENDING_USERS_POLL_INTERVAL_MS);
    };
    const refresh = async () => {
      if (loading) {
        queued = true;
        return;
      }
      loading = true;
      clearTimeout(timeout);
      try {
        const response = await fetchAdminUsers({
          role: 'pending',
          signal: controller.signal,
        });
        if (!cancelled) setCount(response.pagination.total);
      } catch {
        // The notification is optional and should not surface request failures.
      } finally {
        loading = false;
        if (!cancelled && queued) {
          queued = false;
          void refresh();
        } else if (!cancelled) {
          schedule();
        }
      }
    };

    const unsubscribe = subscribeToAdminUserChanges(() => void refresh());
    void refresh();
    return () => {
      cancelled = true;
      controller.abort();
      clearTimeout(timeout);
      unsubscribe();
    };
  }, [enabled]);

  return count;
}
