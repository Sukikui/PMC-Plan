import { useState, useEffect, useCallback } from 'react';

export type AppTheme = 'light' | 'dark' | 'system';

const THEME_STORAGE_KEY = 'pmc-plan-theme';
const SYSTEM_THEME_QUERY = '(prefers-color-scheme: dark)';

export function isAppTheme(value: string | null): value is AppTheme {
  return value === 'light' || value === 'dark' || value === 'system';
}

export function shouldUseDarkTheme(
  selectedTheme: AppTheme,
  systemPrefersDark: boolean,
) {
  return selectedTheme === 'dark'
    || (selectedTheme === 'system' && systemPrefersDark);
}

export function useTheme() {
  const [theme, setTheme] = useState<AppTheme>('system');

  const applyTheme = useCallback((selectedTheme: AppTheme) => {
    const root = document.documentElement;
    const systemPrefersDark = window.matchMedia(SYSTEM_THEME_QUERY).matches;
    root.classList.toggle(
      'dark',
      shouldUseDarkTheme(selectedTheme, systemPrefersDark),
    );
  }, []);

  // Effect to load and apply theme on initial mount
  useEffect(() => {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    const initialTheme = isAppTheme(savedTheme) ? savedTheme : 'system';
    setTheme(initialTheme);
    applyTheme(initialTheme);
  }, [applyTheme]);

  useEffect(() => {
    if (theme !== 'system') return;
    const mediaQuery = window.matchMedia(SYSTEM_THEME_QUERY);
    const handleSystemThemeChange = () => applyTheme('system');

    mediaQuery.addEventListener('change', handleSystemThemeChange);
    return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
  }, [applyTheme, theme]);

  const handleThemeChange = useCallback((newTheme: AppTheme) => {
    setTheme(newTheme);
    applyTheme(newTheme);
    localStorage.setItem(THEME_STORAGE_KEY, newTheme);
  }, [applyTheme]);

  return { theme, changeTheme: handleThemeChange };
}
