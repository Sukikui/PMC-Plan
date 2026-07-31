'use client';

import type { ReactNode } from 'react';
import CrossIcon from '@/components/icons/CrossIcon';
import IconActionButton from '@/components/ui/IconActionButton';
import { themeColors } from '@/lib/theme-colors';

interface OverlayHeaderFrameProps {
  children: ReactNode;
  className?: string;
}

export function OverlayHeaderFrame({
  children,
  className = '',
}: OverlayHeaderFrameProps) {
  return (
    <header className={`shrink-0 rounded-t-xl border-b p-6 ${themeColors.border.primary} ${themeColors.panel.primary} ${themeColors.transition} ${className}`}>
      {children}
    </header>
  );
}

interface OverlayHeaderProps {
  actions?: ReactNode;
  onClose?: () => void;
  subtitle?: ReactNode;
  title: ReactNode;
  titleId?: string;
}

export default function OverlayHeader({
  actions,
  onClose,
  subtitle,
  title,
  titleId,
}: OverlayHeaderProps) {
  return (
    <OverlayHeaderFrame>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h2
            id={titleId}
            className={`text-2xl font-bold ${themeColors.text.primary} ${themeColors.transition}`}
          >
            {title}
          </h2>
          {subtitle && (
            <div className={`mt-0.5 text-sm ${themeColors.text.tertiary} ${themeColors.transition}`}>
              {subtitle}
            </div>
          )}
        </div>
        {(actions || onClose) && (
          <div className="flex shrink-0 gap-2">
            {actions}
            {onClose && (
              <IconActionButton onClick={onClose} aria-label="Fermer">
                <CrossIcon className={`h-4 w-4 ${themeColors.text.secondary}`} />
              </IconActionButton>
            )}
          </div>
        )}
      </div>
    </OverlayHeaderFrame>
  );
}
