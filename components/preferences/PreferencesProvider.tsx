'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useSession } from 'next-auth/react';
import {
  DEFAULT_APP_PREFERENCES,
  parseAppPreferences,
  shouldUseDarkTheme,
  type AppPreferences,
  type AppTheme,
  type MapPreferences,
} from '@/lib/preferences';
import {
  readAccountPreferences,
  readGuestPreferences,
  writeAccountPreferences,
  writeGuestPreferences,
} from '@/lib/preferences-storage';

const SYNC_DELAY_MS = 350;
const SYSTEM_THEME_QUERY = '(prefers-color-scheme: dark)';

interface PreferencesContextValue {
  flushPreferences: () => Promise<void>;
  preferences: AppPreferences;
  setTheme: (theme: AppTheme) => void;
  setMapPreference: <Key extends keyof MapPreferences>(
    key: Key,
    value: MapPreferences[Key],
  ) => void;
}

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const [preferences, setPreferences] = useState(DEFAULT_APP_PREFERENCES);
  const activeUserIdRef = useRef<string | null>(null);
  const serverReadyRef = useRef(false);
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadVersionRef = useRef(0);
  const pendingBootstrapRef = useRef<AppPreferences | null>(null);
  const pendingServerUpdateRef = useRef<{
    preferences: AppPreferences;
    userId: string;
  } | null>(null);
  const serverWriteChainRef = useRef<Promise<void>>(Promise.resolve());

  const flushPreferences = useCallback(async () => {
    if (syncTimerRef.current) {
      clearTimeout(syncTimerRef.current);
      syncTimerRef.current = null;
    }
    const pending = pendingServerUpdateRef.current;
    if (
      !pending
      || !serverReadyRef.current
      || activeUserIdRef.current !== pending.userId
    ) {
      await serverWriteChainRef.current;
      return;
    }
    pendingServerUpdateRef.current = null;
    const write = serverWriteChainRef.current.then(async () => {
      if (
        !serverReadyRef.current
        || activeUserIdRef.current !== pending.userId
      ) return;
      const stored = await saveServerPreferences(pending.preferences);
      if (
        !stored
        && activeUserIdRef.current === pending.userId
        && !pendingServerUpdateRef.current
      ) {
        pendingServerUpdateRef.current = pending;
      }
    });
    serverWriteChainRef.current = write.catch(() => undefined);
    await write;
  }, []);

  const persistUpdate = useCallback((next: AppPreferences) => {
    const userId = activeUserIdRef.current;
    if (!userId) {
      writeGuestPreferences(localStorage, next);
      return;
    }

    writeAccountPreferences(localStorage, userId, next);
    if (!serverReadyRef.current) {
      pendingBootstrapRef.current = next;
      return;
    }
    pendingServerUpdateRef.current = { preferences: next, userId };
    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    syncTimerRef.current = setTimeout(() => {
      void flushPreferences();
    }, SYNC_DELAY_MS);
  }, [flushPreferences]);

  const updatePreferences = useCallback(
    (update: (current: AppPreferences) => AppPreferences) => {
      setPreferences((current) => {
        const next = parseAppPreferences(update(current)) ?? current;
        persistUpdate(next);
        return next;
      });
    },
    [persistUpdate],
  );

  const setTheme = useCallback((theme: AppTheme) => {
    updatePreferences((current) => ({ ...current, theme }));
  }, [updatePreferences]);

  const setMapPreference = useCallback(<Key extends keyof MapPreferences>(
    key: Key,
    value: MapPreferences[Key],
  ) => {
    updatePreferences((current) => ({
      ...current,
      map: { ...current.map, [key]: value },
    }));
  }, [updatePreferences]);

  useEffect(() => {
    if (status === 'loading') return;
    const loadVersion = ++loadVersionRef.current;
    serverReadyRef.current = false;
    pendingBootstrapRef.current = null;
    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);

    const userId = session?.user?.id ?? null;
    if (activeUserIdRef.current !== userId) {
      pendingServerUpdateRef.current = null;
    }
    activeUserIdRef.current = userId;
    if (!userId) {
      setPreferences(readGuestPreferences(localStorage));
      return;
    }

    const cached = readAccountPreferences(localStorage, userId);
    setPreferences(cached ?? readGuestPreferences(localStorage));

    void loadServerPreferences().then((result) => {
      if (loadVersion !== loadVersionRef.current) return;
      if (!result.ok) return;

      const serverPreferences = result.preferences;
      const next = serverPreferences
        ?? pendingBootstrapRef.current
        ?? readGuestPreferences(localStorage);

      if (serverPreferences) {
        setPreferences(next);
        writeAccountPreferences(localStorage, userId, next);
        serverReadyRef.current = true;
        pendingBootstrapRef.current = null;
        if (result.migrated) persistUpdate(next);
        return;
      }

      void initializeServerPreferences(next).then((stored) => {
        if (loadVersion !== loadVersionRef.current || !stored) return;
        const pending = pendingBootstrapRef.current;
        const effective = pending ?? stored;
        setPreferences(effective);
        writeAccountPreferences(localStorage, userId, effective);
        serverReadyRef.current = true;
        pendingBootstrapRef.current = null;
        if (pending) persistUpdate(pending);
      });
    });

    return () => {
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    };
  }, [persistUpdate, session?.user?.id, status]);

  useEffect(() => {
    const handlePageHide = () => void flushPreferences();
    window.addEventListener('pagehide', handlePageHide);
    return () => window.removeEventListener('pagehide', handlePageHide);
  }, [flushPreferences]);

  useEffect(() => applyTheme(preferences.theme), [preferences.theme]);

  useEffect(() => {
    if (preferences.theme !== 'system') return;
    const mediaQuery = window.matchMedia(SYSTEM_THEME_QUERY);
    const handleChange = () => applyTheme('system');
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [preferences.theme]);

  const value = useMemo(() => ({
    flushPreferences,
    preferences,
    setTheme,
    setMapPreference,
  }), [
    flushPreferences,
    preferences,
    setMapPreference,
    setTheme,
  ]);

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (!context) throw new Error('usePreferences requires PreferencesProvider');
  return context;
}

export function useMapAppearance() {
  const { preferences, setMapPreference } = usePreferences();
  const map = preferences.map;

  return {
    ...map,
    pointBorderWidth: [0, 1, 1.5, 2][map.pointBorderLevel],
    pointSizePx: [6, 8, 10, 12][map.pointSize],
    setZoomIconsEnabled: (value: boolean) => setMapPreference('zoomIconsEnabled', value),
    setImagePreviewsEnabled: (value: boolean) => setMapPreference('imagePreviewsEnabled', value),
    setPointBorderLevel: (value: number) => setMapPreference('pointBorderLevel', value),
    setTranslucentPointBorders: (value: boolean) => setMapPreference('translucentPointBorders', value),
    setPointSize: (value: number) => setMapPreference('pointSize', value),
    setNetherAxesEnabled: (value: boolean) => setMapPreference('netherAxesEnabled', value),
    setZoomLabelsEnabled: (value: boolean) => setMapPreference('zoomLabelsEnabled', value),
    setPointerCoordinatesEnabled: (value: boolean) => setMapPreference('pointerCoordinatesEnabled', value),
    setDominantSpaceIndicatorEnabled: (value: boolean) => setMapPreference('dominantSpaceIndicatorEnabled', value),
  };
}

function applyTheme(theme: AppTheme) {
  const systemPrefersDark = window.matchMedia(SYSTEM_THEME_QUERY).matches;
  document.documentElement.classList.toggle(
    'dark',
    shouldUseDarkTheme(theme, systemPrefersDark),
  );
}

async function loadServerPreferences(): Promise<
  { ok: true; preferences: AppPreferences | null; migrated: boolean } | { ok: false }
> {
  try {
    const response = await fetch('/api/account/preferences', { cache: 'no-store' });
    if (!response.ok) return { ok: false };
    const payload = await response.json() as { preferences?: unknown };
    if (payload.preferences === null) {
      return { ok: true, preferences: null, migrated: false };
    }
    const preferences = parseAppPreferences(payload.preferences);
    return preferences
      ? {
          ok: true,
          preferences,
          migrated: getPreferenceVersion(payload.preferences) !== preferences.version,
        }
      : { ok: false };
  } catch {
    return { ok: false };
  }
}

function getPreferenceVersion(value: unknown) {
  return typeof value === 'object' && value !== null && 'version' in value
    ? value.version
    : null;
}

async function initializeServerPreferences(preferences: AppPreferences) {
  return saveServerPreferences(preferences, true);
}

async function saveServerPreferences(
  preferences: AppPreferences,
  initializeOnly = false,
) {
  try {
    const response = await fetch('/api/account/preferences', {
      method: 'PUT',
      keepalive: true,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ preferences, initializeOnly }),
    });
    if (!response.ok) return null;
    const payload = await response.json() as { preferences?: unknown };
    return parseAppPreferences(payload.preferences);
  } catch {
    return null;
  }
}
