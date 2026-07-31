'use client';

import { useAdminMode } from '@/components/admin/AdminModeProvider';
import { themeColors } from '@/lib/theme-colors';

const debugModeOptions = [
  { label: 'Activé', value: true },
  { label: 'Désactivé', value: false },
] as const;

export default function AdminDebugModeToggle() {
  const { debugModeEnabled, setDebugModeEnabled } = useAdminMode();

  return (
    <div
      role="radiogroup"
      aria-label="Mode debug"
      className="flex gap-1"
    >
      {debugModeOptions.map((option) => {
        const active = debugModeEnabled === option.value;

        return (
          <button
            key={option.label}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setDebugModeEnabled(option.value)}
            className={`${themeColors.toggle.compactBase} ${
              active
                ? themeColors.toggle.activeBlue
                : themeColors.toggle.inactive
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
