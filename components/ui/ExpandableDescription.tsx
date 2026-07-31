'use client';

import {
  useId,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from 'react';
import InformationCircleIcon from '@/components/icons/InformationCircleIcon';
import {
  ExpandableSection,
  expandableInteractionClassName,
} from '@/components/ui/ExpandableSection';
import { themeColors } from '@/lib/theme-colors';

interface ExpandableDescriptionProps {
  children: ReactNode;
  className?: string;
  description?: string | null;
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
}

export default function ExpandableDescription({
  children,
  className = '',
  description,
  expanded,
  onExpandedChange,
}: ExpandableDescriptionProps) {
  const panelId = useId();
  const content = description?.trim() || null;

  const toggleDescription = () => onExpandedChange(!expanded);
  const handleClick = (event: MouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    if (target.closest('button, a, input, textarea, select')) return;
    toggleDescription();
  };
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return;
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    toggleDescription();
  };

  if (!content) {
    return (
      <div className={className}>
        <div className="min-w-0 pr-7">{children}</div>
      </div>
    );
  }

  return (
    <div
      aria-controls={panelId}
      aria-expanded={expanded}
      className={`${className} ${expandableInteractionClassName}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
    >
      <div className="relative min-w-0 pr-7">
        {children}
        <span
          aria-hidden="true"
          className={`absolute -right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center ${themeColors.util.roundedFull} ${themeColors.transitionAll} ${
            expanded ? themeColors.toggle.activeBlue : themeColors.text.tertiary
          }`}
        >
          <InformationCircleIcon className="h-4 w-4" />
        </span>
      </div>

      <ExpandableSection expanded={expanded} id={panelId}>
        <p className={`mt-3 whitespace-pre-wrap border-t pt-3 text-sm leading-relaxed ${themeColors.border.light} ${themeColors.text.tertiary}`}>
          {content}
        </p>
      </ExpandableSection>
    </div>
  );
}
