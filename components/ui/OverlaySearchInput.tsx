'use client';

import { themeColors } from '@/lib/theme-colors';

interface OverlaySearchInputProps {
  ariaLabel: string;
  onChange: (query: string) => void;
  placeholder: string;
  value: string;
}

export default function OverlaySearchInput({
  ariaLabel,
  onChange,
  placeholder,
  value,
}: OverlaySearchInputProps) {
  return (
    <div className="relative min-w-0 flex-1">
      <input
        aria-label={ariaLabel}
        className={`h-8 w-full border px-3 text-sm ${themeColors.input.search} ${themeColors.util.roundedLg} ${themeColors.transition} ${themeColors.placeholder} focus:outline-none focus:ring-2`}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        type="text"
        value={value}
      />
      {value && (
        <button
          aria-label="Effacer la recherche"
          className={`absolute right-2 top-1/2 -translate-y-1/2 ${themeColors.text.secondary} ${themeColors.interactive.hoverText} ${themeColors.transition}`}
          onClick={() => onChange('')}
          type="button"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              d="M6 18L18 6M6 6l12 12"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
            />
          </svg>
        </button>
      )}
    </div>
  );
}
