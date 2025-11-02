import { useState, useEffect, useCallback } from 'react';

export type AppTheme = 'light' | 'dark' | 'system';

export function useTheme() {
  const [theme, setTheme] = useState<AppTheme>('system');

  const applyTheme = useCallback((selectedTheme: AppTheme) => {
    const root = document.documentElement;
    if (selectedTheme === 'dark') {
      root.classList.add('dark');
    } else if (selectedTheme === 'light') {
      root.classList.remove('dark');
    } else { // 'system'
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  }, []);

  // Effect to load and apply theme on initial mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('pmc-plan-theme');
    const initialTheme = savedTheme && ['light', 'dark', 'system'].includes(savedTheme) ? savedTheme as AppTheme : 'system';
    setTheme(initialTheme);
    applyTheme(initialTheme);
  }, [applyTheme]);

  const handleThemeChange = (newTheme: AppTheme) => {
    setTheme(newTheme);
    applyTheme(newTheme);
    localStorage.setItem('pmc-plan-theme', newTheme);
  };

  return { theme, changeTheme: handleThemeChange };
}
