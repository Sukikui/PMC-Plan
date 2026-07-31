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
import { useOverlayDisclosure } from '@/components/ui/useOverlayDisclosure';

export type SettingsTab = 'account' | 'appearance' | 'credits' | 'admin';

interface SettingsOverlayContextValue {
  activeTab: SettingsTab;
  close: () => void;
  isClosing: boolean;
  isOpen: boolean;
  open: (tab?: SettingsTab) => void;
  setActiveTab: (tab: SettingsTab) => void;
}

const SettingsOverlayContext = createContext<SettingsOverlayContextValue | null>(null);
const AUTH_RETURN_KEY = 'pmc-plan:settings-overlay-after-auth';

export function SettingsOverlayProvider({ children }: { children: ReactNode }) {
  const { status: sessionStatus } = useSession();
  const {
    close,
    isClosing,
    isOpen,
    open: openDisclosure,
  } = useOverlayDisclosure();
  const [activeTab, setActiveTab] = useState<SettingsTab>('account');

  const open = useCallback((tab?: SettingsTab) => {
    if (tab) setActiveTab(tab);
    openDisclosure();
  }, [openDisclosure]);

  useEffect(() => {
    if (sessionStatus === 'loading' || !consumeAuthReturn()) return;
    setActiveTab('account');
    openDisclosure();
  }, [openDisclosure, sessionStatus]);

  const value = useMemo(
    () => ({
      activeTab,
      close,
      isClosing,
      isOpen,
      open,
      setActiveTab,
    }),
    [
      activeTab,
      close,
      isClosing,
      isOpen,
      open,
    ],
  );

  return (
    <SettingsOverlayContext.Provider value={value}>
      {children}
    </SettingsOverlayContext.Provider>
  );
}

export function rememberSettingsOverlayForAuthReturn() {
  window.sessionStorage.setItem(AUTH_RETURN_KEY, 'true');
}

function consumeAuthReturn() {
  if (window.sessionStorage.getItem(AUTH_RETURN_KEY) !== 'true') return false;
  window.sessionStorage.removeItem(AUTH_RETURN_KEY);
  return true;
}

export function useSettingsOverlay() {
  const context = useContext(SettingsOverlayContext);
  if (!context) {
    throw new Error('useSettingsOverlay must be used within SettingsOverlayProvider');
  }
  return context;
}
