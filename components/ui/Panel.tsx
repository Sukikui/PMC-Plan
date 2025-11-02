"use client";

import React from 'react';
import { themeColors } from '@/lib/theme-colors';

interface PanelProps {
  className?: string;
  children: React.ReactNode;
}

const Panel: React.FC<PanelProps> = ({ className = '', children }) => {
  return (
    <div className={`${themeColors.panel.primary} ${themeColors.blur} ${themeColors.shadow.panel} ${themeColors.util.roundedXl} border ${themeColors.border.primary} ${themeColors.transition} ${className}`}>
      {children}
    </div>
  );
};

export default Panel;

