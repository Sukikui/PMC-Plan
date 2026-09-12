import {
  DEFAULT_APP_PREFERENCES,
  parseAppPreferences,
} from '@/lib/preferences';
import {
  GUEST_PREFERENCES_STORAGE_KEY,
  getAccountPreferencesStorageKey,
  readAccountPreferences,
  readGuestPreferences,
  writeAccountPreferences,
} from '@/lib/preferences-storage';

class MemoryStorage {
  private readonly values = new Map<string, string>();

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }

  removeItem(key: string) {
    this.values.delete(key);
  }
}

describe('application preferences', () => {
  it('accepts only complete preferences for the current version', () => {
    expect(parseAppPreferences(DEFAULT_APP_PREFERENCES)).toEqual(DEFAULT_APP_PREFERENCES);
    expect(parseAppPreferences({ ...DEFAULT_APP_PREFERENCES, version: 4 })).toBeNull();
    expect(parseAppPreferences({ version: 1, theme: 'dark' })).toBeNull();
  });

  it('migrates version 1 preferences with pointer coordinates disabled', () => {
    const {
      pointerCoordinatesEnabled: _,
      dominantSpaceIndicatorEnabled: __,
      ...legacyMap
    } = DEFAULT_APP_PREFERENCES.map;
    const legacyPreferences = {
      version: 1,
      theme: 'dark' as const,
      map: legacyMap,
    };

    expect(parseAppPreferences(legacyPreferences)).toEqual({
      ...legacyPreferences,
      version: 3,
      map: {
        ...legacyMap,
        pointerCoordinatesEnabled: false,
        dominantSpaceIndicatorEnabled: true,
      },
    });
  });

  it('migrates version 2 preferences with the dominant space indicator enabled', () => {
    const { dominantSpaceIndicatorEnabled: _, ...legacyMap } = DEFAULT_APP_PREFERENCES.map;
    const legacyPreferences = {
      version: 2,
      theme: 'system' as const,
      map: legacyMap,
    };

    expect(parseAppPreferences(legacyPreferences)).toEqual({
      ...legacyPreferences,
      version: 3,
      map: { ...legacyMap, dominantSpaceIndicatorEnabled: true },
    });
  });

  it('rewrites migrated account preferences in the current format', () => {
    const storage = new MemoryStorage();
    const key = getAccountPreferencesStorageKey('user-1');
    const {
      pointerCoordinatesEnabled: _,
      dominantSpaceIndicatorEnabled: __,
      ...legacyMap
    } = DEFAULT_APP_PREFERENCES.map;
    storage.setItem(key, JSON.stringify({ version: 1, theme: 'light', map: legacyMap }));

    const preferences = readAccountPreferences(storage, 'user-1');

    expect(preferences?.map.pointerCoordinatesEnabled).toBe(false);
    expect(JSON.parse(storage.getItem(key) ?? '{}')).toEqual(preferences);
  });

  it('migrates legacy browser settings into the unified guest document', () => {
    const storage = new MemoryStorage();
    storage.setItem('pmc-plan-theme', 'dark');
    storage.setItem('pmc-plan-map-zoom-icons', 'false');
    storage.setItem('pmc-plan-map-point-border', '3');

    const preferences = readGuestPreferences(storage);

    expect(preferences).toMatchObject({
      theme: 'dark',
      map: { zoomIconsEnabled: false, pointBorderLevel: 3 },
    });
    expect(storage.getItem('pmc-plan-theme')).toBeNull();
    expect(storage.getItem(GUEST_PREFERENCES_STORAGE_KEY)).not.toBeNull();
  });

  it('keeps account caches isolated by user', () => {
    const storage = new MemoryStorage();
    const darkPreferences = { ...DEFAULT_APP_PREFERENCES, theme: 'dark' as const };

    writeAccountPreferences(storage, 'user-1', darkPreferences);

    expect(readAccountPreferences(storage, 'user-1')).toEqual(darkPreferences);
    expect(readAccountPreferences(storage, 'user-2')).toBeNull();
    expect(getAccountPreferencesStorageKey('user-1')).not.toBe(
      getAccountPreferencesStorageKey('user-2'),
    );
  });
});
