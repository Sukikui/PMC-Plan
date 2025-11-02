"use client";

import React from 'react';
import { themeColors } from '@/lib/theme-colors';

interface IconButtonRoundProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string;
}

const IconButtonRound: React.FC<IconButtonRoundProps> = ({ className = '', style, children, ...rest }) => {
  return (
    <button
      className={`${themeColors.button.round} border ${themeColors.border.light} ${themeColors.transitionAll} flex items-center justify-center ${themeColors.util.hoverScale} ${themeColors.util.activeScale} ${themeColors.interactive.hoverBorder} ${className}`}
      style={{
        boxShadow: typeof window !== 'undefined' && document.documentElement.classList.contains('dark')
          ? '0 8px 25px rgba(0, 0, 0, 0.4)'
          : '0 8px 25px rgba(0, 0, 0, 0.15)',
        ...style,
      }}
      {...rest}
    >
      {children}
    </button>
  );
};

export default IconButtonRound;

