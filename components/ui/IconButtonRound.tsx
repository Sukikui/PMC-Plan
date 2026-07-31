"use client";

import React from 'react';
import { themeColors } from '@/lib/theme-colors';

interface IconButtonRoundProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string;
  shadow?: 'default' | 'compact';
}

const IconButtonRound: React.FC<IconButtonRoundProps> = ({
  className = '',
  shadow = 'default',
  children,
  ...rest
}) => {
  const shadowClass = shadow === 'compact'
    ? themeColors.shadow.roundButtonCompact
    : themeColors.shadow.roundButton;

  return (
    <button
      className={`${themeColors.button.round} ${themeColors.panel.primary} ${themeColors.blur} border ${themeColors.border.light} ${shadowClass} ${themeColors.transitionAll} flex items-center justify-center ${themeColors.util.hoverScale} ${themeColors.util.activeScale} ${themeColors.interactive.hoverBorder} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
};

export default IconButtonRound;
