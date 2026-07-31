'use client';

import { themeColors } from '@/lib/theme-colors';

export interface PillTabOption<T extends string> {
  label: string;
  value: T;
}

interface PillTabsProps<T extends string> {
  activeValue: T;
  className?: string;
  onChange: (value: T) => void;
  options: readonly PillTabOption<T>[];
}

export default function PillTabs<T extends string>({
  activeValue,
  className = '',
  onChange,
  options,
}: PillTabsProps<T>) {
  return (
    <div
      className={`flex items-center gap-2 ${className}`}
      role="tablist"
    >
      {options.map((option) => {
        const active = option.value === activeValue;
        return (
          <button
            aria-selected={active}
            className={`${themeColors.toggle.base} shrink-0 ${
              active ? themeColors.toggle.activeBlue : themeColors.toggle.inactive
            } ${themeColors.interactive.focusRing}`}
            key={option.value}
            onClick={() => onChange(option.value)}
            role="tab"
            type="button"
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
