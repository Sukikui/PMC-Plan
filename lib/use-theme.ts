import { useState, useEffect, useCallback } from 'react';

export function useTheme() {
  const [theme, setTheme] = useState('system');

  const applyTheme = useCallback((selectedTheme: string) => {
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
    const initialTheme = savedTheme && ['light', 'dark', 'system'].includes(savedTheme) ? savedTheme : 'system';
    setTheme(initialTheme);
    applyTheme(initialTheme);
  }, [applyTheme]);

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    applyTheme(newTheme);
    localStorage.setItem('pmc-plan-theme', newTheme);
  };

  return { theme, changeTheme: handleThemeChange };
}
