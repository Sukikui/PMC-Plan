import type { HTMLAttributes, ReactNode } from 'react';
import { themeColors } from '@/lib/theme-colors';

interface FloatingStatusBubbleProps extends HTMLAttributes<HTMLDivElement> {
  active?: boolean;
  children: ReactNode;
  highlightOnHover?: boolean;
  shape?: 'pill' | 'rounded';
}

export default function FloatingStatusBubble({
  active = false,
  children,
  className = '',
  highlightOnHover = true,
  shape = 'pill',
  ...props
}: FloatingStatusBubbleProps) {
  return (
    <div
      {...props}
      className={`border ${
        active ? themeColors.panel.primary : themeColors.panel.secondary
      } ${themeColors.border.light} ${
        highlightOnHover ? themeColors.interactive.hoverBorder : ''
      } ${
        themeColors.blurSm
      } ${themeColors.shadow.button} ${themeColors.transition} ${
        shape === 'pill'
          ? themeColors.util.roundedFull
          : themeColors.util.roundedLg
      } ${className}`}
    >
      {children}
    </div>
  );
}
