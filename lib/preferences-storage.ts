import {
  DEFAULT_APP_PREFERENCES,
  isAppTheme,
  parseAppPreferences,
  type AppPreferences,
  type MapPreferences,
} from '@/lib/preferences';

export const GUEST_PREFERENCES_STORAGE_KEY = 'pmc-plan:preferences:guest';
const ACCOUNT_PREFERENCES_STORAGE_PREFIX = 'pmc-plan:preferences:account:';

const LEGACY_THEME_KEY = 'pmc-plan-theme';
const legacyMapKeys = {
  zoomIconsEnabled: 'pmc-plan-map-zoom-icons',
  imagePreviewsEnabled: 'pmc-plan-map-image-previews',
  pointBorderLevel: 'pmc-plan-map-point-border',
  translucentPointBorders: 'pmc-plan-map-translucent-borders',
  pointSize: 'pmc-plan-map-point-size',
  netherAxesEnabled: 'pmc-plan-map-nether-axes',
  zoomLabelsEnabled: 'pmc-plan-map-zoom-labels',
} satisfies Partial<Record<keyof MapPreferences, string>>;

export interface PreferencesStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export function getAccountPreferencesStorageKey(userId: string) {
  return `${ACCOUNT_PREFERENCES_STORAGE_PREFIX}${userId}`;
}

export function readGuestPreferences(storage: PreferencesStorage): AppPreferences {
  const stored = readPreferences(storage, GUEST_PREFERENCES_STORAGE_KEY);
  if (stored) return stored;

  const migrated = readLegacyPreferences(storage);
  writePreferences(storage, GUEST_PREFERENCES_STORAGE_KEY, migrated);
  removeLegacyPreferences(storage);
  return migrated;
}

export function readAccountPreferences(
  storage: PreferencesStorage,
  userId: string,
) {
  return readPreferences(storage, getAccountPreferencesStorageKey(userId));
}

export function writeGuestPreferences(
  storage: PreferencesStorage,
  preferences: AppPreferences,
) {
  writePreferences(storage, GUEST_PREFERENCES_STORAGE_KEY, preferences);
}

export function writeAccountPreferences(
  storage: PreferencesStorage,
  userId: string,
  preferences: AppPreferences,
) {
  writePreferences(storage, getAccountPreferencesStorageKey(userId), preferences);
}

function readPreferences(storage: PreferencesStorage, key: string) {
  try {
    const value = storage.getItem(key);
    if (!value) return null;
    const rawPreferences = JSON.parse(value) as unknown;
    const preferences = parseAppPreferences(rawPreferences);
    if (preferences && !isCurrentPreferences(rawPreferences)) {
      writePreferences(storage, key, preferences);
    }
    return preferences;
  } catch {
    return null;
  }
}

function isCurrentPreferences(value: unknown) {
  return typeof value === 'object'
    && value !== null
    && 'version' in value
    && value.version === DEFAULT_APP_PREFERENCES.version;
}

function writePreferences(
  storage: PreferencesStorage,
  key: string,
  preferences: AppPreferences,
) {
  try {
    storage.setItem(key, JSON.stringify(preferences));
  } catch {
    // Preferences still apply to the current browser session.
  }
}

function readLegacyPreferences(storage: PreferencesStorage): AppPreferences {
  const preferences = structuredClone(DEFAULT_APP_PREFERENCES);

  try {
    const theme = storage.getItem(LEGACY_THEME_KEY);
    if (isAppTheme(theme)) preferences.theme = theme;

    for (const [name, key] of Object.entries(legacyMapKeys) as [
      keyof MapPreferences,
      string,
    ][]) {
      const stored = storage.getItem(key);
      const defaultValue = preferences.map[name];
      const parsed = typeof defaultValue === 'boolean'
        ? parseBoolean(stored)
        : parseLevel(stored);
      if (parsed !== null) {
        (preferences.map[name] as boolean | number) = parsed;
      }
    }
  } catch {
    return preferences;
  }

  return preferences;
}

function removeLegacyPreferences(storage: PreferencesStorage) {
  try {
    storage.removeItem(LEGACY_THEME_KEY);
    Object.values(legacyMapKeys).forEach((key) => storage.removeItem(key));
  } catch {
    // Leaving obsolete keys is harmless when browser storage is unavailable.
  }
}

function parseBoolean(value: string | null) {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return null;
}

function parseLevel(value: string | null) {
  if (value === null || !/^[0-3]$/.test(value)) return null;
  return Number(value);
}
