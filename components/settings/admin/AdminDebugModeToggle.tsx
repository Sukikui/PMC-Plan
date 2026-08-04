'use client';

import { useAdminMode } from '@/components/admin/AdminModeProvider';
import CompactChoiceGroup from '@/components/form/common/CompactChoiceGroup';

const debugModeOptions = [
  { label: 'Activé', value: 'enabled' },
  { label: 'Désactivé', value: 'disabled' },
] as const;

export default function AdminDebugModeToggle() {
  const { debugModeEnabled, setDebugModeEnabled } = useAdminMode();

  return (
    <CompactChoiceGroup
      ariaLabel="Mode debug"
      onChange={(value) => setDebugModeEnabled(value === 'enabled')}
      options={debugModeOptions}
      value={debugModeEnabled ? 'enabled' : 'disabled'}
    />
  );
}
