'use client';

import { themeColors } from '@/lib/theme-colors';
import PillTabs, {
  type PillTabOption,
} from '@/components/ui/PillTabs';

export type OverlayTabOption<T extends string> = PillTabOption<T>;

interface OverlayTabsProps<T extends string> {
  activeValue: T;
  onChange: (value: T) => void;
  options: readonly OverlayTabOption<T>[];
  showGradient?: boolean;
}

export default function OverlayTabs<T extends string>({
  activeValue,
  onChange,
  options,
  showGradient = true,
}: OverlayTabsProps<T>) {
  return (
    <>
      {showGradient && (
        <div className={`pointer-events-none absolute inset-x-0 top-0 z-10 h-20 gradient-top-solid-blur ${themeColors.transition}`} />
      )}
      {options.length > 0 && (
        <PillTabs
          activeValue={activeValue}
          onChange={onChange}
          options={options}
          className="absolute inset-x-0 top-0 z-20 flex items-center gap-2 overflow-x-auto px-6 pb-2 pt-4 [&::-webkit-scrollbar]:hidden"
        />
      )}
    </>
  );
}
