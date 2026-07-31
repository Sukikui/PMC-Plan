import type { ReactNode } from 'react';
import { themeColors } from '@/lib/theme-colors';

interface ExpandableSectionProps {
  children: ReactNode;
  expanded: boolean;
  id?: string;
}

export const expandableInteractionClassName =
  `min-w-0 cursor-pointer ${themeColors.interactive.focusRing}`;

export function ExpandableSection({
  children,
  expanded,
  id,
}: ExpandableSectionProps) {
  return (
    <div
      aria-hidden={!expanded}
      className={`grid overflow-hidden transition-[grid-template-rows] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] ${
        expanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
      }`}
      id={id}
    >
      <div className="min-h-0 overflow-hidden">
        <div
          className={`transition-[opacity,transform] duration-200 ease-out ${
            expanded
              ? 'translate-y-0 opacity-100'
              : '-translate-y-1 opacity-0'
          }`}
          inert={!expanded}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
