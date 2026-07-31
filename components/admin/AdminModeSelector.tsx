'use client';

import { useEffect, useRef, useState } from 'react';
import { useAdminMode } from '@/components/admin/AdminModeProvider';
import {
  adminModeActiveClasses,
  adminModeOptions,
} from '@/components/admin/admin-mode-ui';
import type { AdminViewMode } from '@/lib/admin/roles';
import { themeColors } from '@/lib/theme-colors';

export default function AdminModeSelector({
  collapsed,
}: {
  collapsed?: boolean;
}) {
  const { mode, canUseMode, setMode } = useAdminMode();
  const [shake, setShake] = useState<{ mode: AdminViewMode | null; run: number }>({
    mode: null,
    run: 0,
  });
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  const selectMode = (nextMode: AdminViewMode) => {
    if (canUseMode(nextMode)) {
      setMode(nextMode);
      return;
    }

    setShake((current) => ({ mode: nextMode, run: current.run + 1 }));
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setShake((current) => ({ ...current, mode: null }));
    }, 500);
  };

  return (
    <div
      role="radiogroup"
      aria-label="Mode de prévisualisation"
      className={`flex ${collapsed === undefined ? 'flex-wrap gap-1' : `flex-nowrap ${collapsed ? 'gap-0' : 'gap-1'} transition-[gap] duration-200 ease-out`}`}
    >
      {adminModeOptions.map((option) => {
        const active = mode === option.value;
        const shaking = shake.mode === option.value;
        const visible = collapsed === undefined || !collapsed || active;
        const button = (
          <button
            key={`${option.value}-${shaking ? shake.run : 0}`}
            type="button"
            role="radio"
            aria-checked={active}
            aria-disabled={!canUseMode(option.value)}
            tabIndex={visible ? 0 : -1}
            onClick={() => selectMode(option.value)}
            className={`flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full border px-2 py-1 text-xs ${themeColors.transition} ${
              active
                ? `${adminModeActiveClasses[option.value]} border-transparent`
                : `${themeColors.button.ghost} ${themeColors.interactive.hover}`
            } ${shaking ? themeColors.util.animatePulse : ''}`}
            style={{ animation: shaking ? 'panel-shake 0.5s ease-in-out' : undefined }}
          >
            {option.label}
          </button>
        );

        if (collapsed === undefined) {
          return button;
        }

        return (
          <span
            key={`${option.value}-${shaking ? shake.run : 0}`}
            aria-hidden={!visible}
            inert={!visible}
            className={`inline-flex overflow-hidden transition-[max-width,opacity] duration-200 ease-out ${
              visible ? 'max-w-28 opacity-100' : 'max-w-0 opacity-0'
            }`}
          >
            {button}
          </span>
        );
      })}
    </div>
  );
}
