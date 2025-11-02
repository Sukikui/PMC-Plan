"use client";

import React from 'react';
import SunIcon from '@/components/icons/SunIcon';
import MoonIcon from '@/components/icons/MoonIcon';
import MonitorIcon from '@/components/icons/MonitorIcon';
import { themeColors } from '@/lib/theme-colors';

export type AppTheme = 'light' | 'dark' | 'system';

interface ThemeSelectorProps {
  value: AppTheme;
  onChange: (theme: AppTheme) => void;
  showLabel?: boolean;
}

const ThemeSelector: React.FC<ThemeSelectorProps> = ({ value, onChange, showLabel = true }) => {
  return (
    <div className="flex items-center gap-3 mb-4">
      {showLabel && (
        <label className={`text-xs font-medium ${themeColors.text.quaternary} ${themeColors.transition}`}>Thème</label>
      )}
      <div className="flex gap-1">
        <button
          onClick={() => onChange('light')}
          className={`px-2 py-1 text-xs ${themeColors.util.roundedFull} border ${themeColors.transition} flex items-center gap-1 ${
            value === 'light' ? themeColors.theme.light : `${themeColors.button.ghost} ${themeColors.interactive.hover}`
          }`}
        >
          <SunIcon className="w-3 h-3" />
          Clair
        </button>
        <button
          onClick={() => onChange('dark')}
          className={`px-2 py-1 text-xs ${themeColors.util.roundedFull} border ${themeColors.transition} flex items-center gap-1 ${
            value === 'dark' ? themeColors.theme.dark : `${themeColors.button.ghost} ${themeColors.interactive.hover}`
          }`}
        >
          <MoonIcon className="w-3 h-3" />
          Sombre
        </button>
        <button
          onClick={() => onChange('system')}
          className={`px-2 py-1 text-xs ${themeColors.util.roundedFull} border ${themeColors.transition} flex items-center gap-1 ${
            value === 'system' ? themeColors.theme.system : `${themeColors.button.ghost} ${themeColors.interactive.hover}`
          }`}
        >
          <MonitorIcon className="w-3 h-3" />
          Système
        </button>
      </div>
    </div>
  );
};

export default ThemeSelector;
