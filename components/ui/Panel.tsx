"use client";

import type {
  HTMLAttributes,
  PropsWithChildren,
} from 'react';
import { themeColors } from '@/lib/theme-colors';

type PanelProps = PropsWithChildren<HTMLAttributes<HTMLDivElement>>;

export default function Panel({
  className = '',
  children,
  ...divProps
}: PanelProps) {
  return (
    <div
      className={`${themeColors.panel.primary} ${themeColors.blur} ${themeColors.shadow.panel} ${themeColors.util.roundedXl} border ${themeColors.border.primary} ${themeColors.transition} ${className}`}
      {...divProps}
    >
      {children}
    </div>
  );
}
