"use client";

import React from 'react';
import { themeColors } from '@/lib/theme-colors';

interface SectionSeparatorProps {
  className?: string;
}

const SectionSeparator: React.FC<SectionSeparatorProps> = ({ className = '' }) => {
  return <div className={`border-t ${themeColors.border.primary} ${className}`} />;
};

export default SectionSeparator;

