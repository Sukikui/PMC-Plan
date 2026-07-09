"use client";

import React from 'react';
import { themeColors } from '@/lib/theme-colors';

interface IconActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string;
  borderTone?: 'light' | 'secondary';
}

export default function IconActionButton({
  className = '',
  borderTone = 'light',
  children,
  ...props
}: IconActionButtonProps) {
  const borderClass = borderTone === 'secondary' ? themeColors.border.secondary : themeColors.border.light;

  return (
    <button
      className={`${themeColors.button.iconAction} ${themeColors.util.roundedFull} border ${borderClass} ${themeColors.shadow.button} ${themeColors.transitionAll} ${themeColors.util.hoverScale} ${themeColors.util.activeScale} ${themeColors.interactive.hoverBorder} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
