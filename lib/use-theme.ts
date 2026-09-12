import { usePreferences } from '@/components/preferences/PreferencesProvider';

export function useTheme() {
  const { preferences, setTheme } = usePreferences();
  return { theme: preferences.theme, changeTheme: setTheme };
}
