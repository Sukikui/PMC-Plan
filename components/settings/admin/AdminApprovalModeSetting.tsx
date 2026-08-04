'use client';

import { useEffect, useState } from 'react';
import CompactChoiceGroup from '@/components/form/common/CompactChoiceGroup';
import {
  fetchAdminApplicationSettings,
  updateAdminApplicationSettings,
} from '@/lib/admin/client';
import { themeColors } from '@/lib/theme-colors';

type ApprovalMode = 'manual' | 'automatic';

const approvalModes = [
  { label: 'Manuelle', value: 'manual' },
  { label: 'Automatique', value: 'automatic' },
] as const;

export default function AdminApprovalModeSetting() {
  const [mode, setMode] = useState<ApprovalMode>('manual');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetchAdminApplicationSettings(controller.signal)
      .then((settings) => {
        setMode(settings.automaticUserApproval ? 'automatic' : 'manual');
        setError(null);
      })
      .catch((requestError) => {
        if (controller.signal.aborted) return;
        setError(requestError instanceof Error ? requestError.message : 'Erreur inconnue.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);

  const updateMode = async (nextMode: ApprovalMode) => {
    if (nextMode === mode || saving) return;
    const previousMode = mode;
    setMode(nextMode);
    setSaving(true);
    setError(null);
    try {
      const settings = await updateAdminApplicationSettings({
        automaticUserApproval: nextMode === 'automatic',
      });
      setMode(settings.automaticUserApproval ? 'automatic' : 'manual');
    } catch (requestError) {
      setMode(previousMode);
      setError(requestError instanceof Error ? requestError.message : 'Erreur inconnue.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className={`text-sm font-medium ${themeColors.text.primary}`}>
            Approbation des comptes
          </h3>
          <p className={`mt-0.5 text-xs ${themeColors.text.tertiary}`}>
            Détermine si les nouveaux comptes sont approuvés automatiquement.
          </p>
        </div>
        <CompactChoiceGroup
          ariaLabel="Mode d’approbation des comptes"
          disabled={loading || saving}
          onChange={updateMode}
          options={approvalModes}
          value={mode}
        />
      </div>
      {error && (
        <p className={`mt-2 text-xs ${themeColors.feedback.errorText}`}>
          {error}
        </p>
      )}
    </div>
  );
}
