import type { HTMLAttributes, ReactNode } from 'react';
import { themeColors } from '@/lib/theme-colors';

interface FloatingStatusBubbleProps extends HTMLAttributes<HTMLDivElement> {
  active?: boolean;
  children: ReactNode;
  highlightOnHover?: boolean;
  shape?: 'pill' | 'rounded';
}

export const floatingStatusBubbleCompactClassName = 'h-9 items-center text-xs font-medium';

export function getFloatingStatusBubbleClassName({
  active = false,
  className = '',
  highlightOnHover = true,
  shape = 'pill',
}: Pick<
  FloatingStatusBubbleProps,
  'active' | 'className' | 'highlightOnHover' | 'shape'
> = {}) {
  return `border ${
    active ? themeColors.panel.primary : themeColors.panel.secondary
  } ${themeColors.border.light} ${
    highlightOnHover ? themeColors.interactive.hoverBorder : ''
  } ${themeColors.blurSm} ${themeColors.shadow.button} ${themeColors.transition} ${
    shape === 'pill'
      ? themeColors.util.roundedFull
      : themeColors.util.roundedLg
  } ${className}`;
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
      className={getFloatingStatusBubbleClassName({
        active,
        className,
        highlightOnHover,
        shape,
      })}
    >
      {children}
    </div>
  );
}
