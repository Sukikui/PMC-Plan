'use client';

import { themeColors } from '@/lib/theme-colors';

interface CompactChoice<T extends string> {
  label: string;
  value: T;
}

interface CompactChoiceGroupProps<T extends string> {
  ariaLabel: string;
  className?: string;
  disabled?: boolean;
  onChange: (value: T) => void;
  options: readonly CompactChoice<T>[];
  value: T;
}

export default function CompactChoiceGroup<T extends string>({
  ariaLabel,
  className = '',
  disabled = false,
  onChange,
  options,
  value,
}: CompactChoiceGroupProps<T>) {
  return (
    <div
      aria-label={ariaLabel}
      className={`flex gap-1 ${className}`}
      role="radiogroup"
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            aria-checked={active}
            className={`${themeColors.toggle.compactBase} ${
              active ? themeColors.toggle.activeBlue : themeColors.toggle.inactive
            }`}
            disabled={disabled}
            key={option.value}
            onClick={() => onChange(option.value)}
            role="radio"
            type="button"
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
