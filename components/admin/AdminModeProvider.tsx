'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useSession } from 'next-auth/react';
import {
  ADMIN_DEBUG_MODE_COOKIE,
  ADMIN_VIEW_MODE_COOKIE,
  type AdminViewMode,
  canUseAdminViewMode,
  getEffectiveRole,
  getMaximumAdminViewMode,
  isAdministrationRole,
  parseAdminViewMode,
} from '@/lib/admin/roles';

const MODE_STORAGE_KEY = 'pmc-plan-admin-mode';
const DEBUG_MODE_STORAGE_KEY = 'pmc-plan-admin-debug';

interface AdminModeContextValue {
  available: boolean;
  debugModeEnabled: boolean;
  effectiveRole?: string;
  mode: AdminViewMode;
  realRole?: string;
  canUseMode: (mode: AdminViewMode) => boolean;
  setDebugModeEnabled: (enabled: boolean) => void;
  setMode: (mode: AdminViewMode) => void;
}

const AdminModeContext = createContext<AdminModeContextValue | null>(null);

export function AdminModeProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const role = session?.user?.role;
  const available = isAdministrationRole(role);
  const maximumMode = getMaximumAdminViewMode(role);
  const [debugModeEnabled, setDebugModeEnabledState] = useState(false);
  const [mode, setModeState] = useState<AdminViewMode>('user');
  const canUseMode = useCallback(
    (nextMode: AdminViewMode) => canUseAdminViewMode(role, nextMode),
    [role],
  );

  useEffect(() => {
    if (status === 'loading') return;
    const nextDebugModeEnabled = available
      && localStorage.getItem(DEBUG_MODE_STORAGE_KEY) === 'true';
    const storedMode = parseAdminViewMode(
      localStorage.getItem(MODE_STORAGE_KEY),
    );
    const nextMode = nextDebugModeEnabled
      && storedMode
      && canUseMode(storedMode)
      ? storedMode
      : maximumMode;

    setDebugModeEnabledState(nextDebugModeEnabled);
    setModeState(nextMode);
    persistDebugMode(nextDebugModeEnabled);
    persistMode(nextMode);
  }, [available, canUseMode, maximumMode, status]);

  const setDebugModeEnabled = useCallback((enabled: boolean) => {
    const nextEnabled = available && enabled;
    setDebugModeEnabledState(nextEnabled);
    localStorage.setItem(DEBUG_MODE_STORAGE_KEY, String(nextEnabled));
    persistDebugMode(nextEnabled);

    if (nextEnabled) return;
    setModeState(maximumMode);
    localStorage.setItem(MODE_STORAGE_KEY, maximumMode);
    persistMode(maximumMode);
  }, [available, maximumMode]);

  const setMode = useCallback((nextMode: AdminViewMode) => {
    if (!debugModeEnabled || !canUseMode(nextMode)) return;
    setModeState(nextMode);
    localStorage.setItem(MODE_STORAGE_KEY, nextMode);
    persistMode(nextMode);
  }, [canUseMode, debugModeEnabled]);

  const activeMode = debugModeEnabled ? mode : maximumMode;

  const value = useMemo(
    () => ({
      available,
      debugModeEnabled,
      effectiveRole: getEffectiveRole(role, activeMode),
      mode: activeMode,
      realRole: role,
      canUseMode,
      setDebugModeEnabled,
      setMode,
    }),
    [
      activeMode,
      available,
      canUseMode,
      debugModeEnabled,
      role,
      setDebugModeEnabled,
      setMode,
    ],
  );

  return (
    <AdminModeContext.Provider value={value}>
      {children}
    </AdminModeContext.Provider>
  );
}

export function useAdminMode() {
  const context = useContext(AdminModeContext);
  if (!context) {
    throw new Error('useAdminMode must be used within AdminModeProvider');
  }
  return context;
}

function persistMode(mode: AdminViewMode) {
  persistCookie(ADMIN_VIEW_MODE_COOKIE, mode);
}

function persistDebugMode(enabled: boolean) {
  persistCookie(ADMIN_DEBUG_MODE_COOKIE, String(enabled));
}

function persistCookie(name: string, value: string) {
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${name}=${value}; Path=/; Max-Age=31536000; SameSite=Lax${secure}`;
}
