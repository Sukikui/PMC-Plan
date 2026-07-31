'use client';

import { useEffect, useRef, useState } from 'react';
import WrenchIcon from '@/components/icons/WrenchIcon';
import { useAdminMode } from '@/components/admin/AdminModeProvider';
import AdminModeSelector from '@/components/admin/AdminModeSelector';
import FloatingStatusBubble from '@/components/ui/FloatingStatusBubble';
import { themeColors } from '@/lib/theme-colors';
import { GLOBAL_FOREGROUND_Z_INDEX } from '@/lib/ui/overlay';

const EXPAND_DELAY_MS = 120;
const COLLAPSE_DELAY_MS = 240;

export default function AdminModeIndicator() {
  const { available, debugModeEnabled } = useAdminMode();
  const [expanded, setExpanded] = useState(false);
  const expansionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shown = available && debugModeEnabled;

  const scheduleExpansion = (nextExpanded: boolean, delay: number) => {
    if (expansionTimerRef.current) clearTimeout(expansionTimerRef.current);
    expansionTimerRef.current = setTimeout(() => {
      expansionTimerRef.current = null;
      setExpanded(nextExpanded);
    }, delay);
  };

  const expandImmediately = () => {
    if (expansionTimerRef.current) clearTimeout(expansionTimerRef.current);
    expansionTimerRef.current = null;
    setExpanded(true);
  };

  useEffect(() => () => {
    if (expansionTimerRef.current) clearTimeout(expansionTimerRef.current);
  }, []);

  return (
    <div
      aria-hidden={!shown}
      inert={!shown}
      className={`fixed bottom-4 left-4 ${
        shown
          ? 'pointer-events-auto translate-y-0 opacity-100'
          : 'pointer-events-none translate-y-2 opacity-0'
      } ${themeColors.transitionAll}`}
      style={{ zIndex: GLOBAL_FOREGROUND_Z_INDEX }}
    >
      <FloatingStatusBubble
        active={expanded}
        onMouseEnter={() => scheduleExpansion(true, EXPAND_DELAY_MS)}
        onMouseLeave={() => scheduleExpansion(false, COLLAPSE_DELAY_MS)}
        onFocus={expandImmediately}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) {
            scheduleExpansion(false, COLLAPSE_DELAY_MS);
          }
        }}
        className="flex items-center gap-1.5 py-1 pl-2 pr-1"
      >
        <WrenchIcon className={`h-4 w-4 ${themeColors.text.tertiary}`} />
        <span className={`text-xs font-medium ${themeColors.text.tertiary}`}>
          Mode
        </span>
        <AdminModeSelector collapsed={!expanded} />
      </FloatingStatusBubble>
    </div>
  );
}
