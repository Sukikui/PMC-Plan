'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { Session } from 'next-auth';
import type { Place, Portal } from '@/lib/api/types';
import type { DestinationType } from '@/lib/destination/selection';
import type { MineVerifyPublicStatus } from '@/lib/mineverify/types';
import type { AppTheme } from '@/components/settings/ThemeSelector';
import AccountSettings from '@/components/settings/account/AccountSettings';
import AdminSettings from '@/components/settings/admin/AdminSettings';
import AdminUserTransferOverlay from '@/components/settings/admin/AdminUserTransferOverlay';
import AppearanceSettings from '@/components/settings/appearance/AppearanceSettings';
import CreditsSettings from '@/components/settings/credits/CreditsSettings';
import OverlayPanel from '@/components/ui/OverlayPanel';
import OverlaySlider from '@/components/ui/OverlaySlider';
import { isAdministrationRole } from '@/lib/admin/roles';
import type { SettingsTab } from '@/components/settings/SettingsOverlayProvider';
import { useOverlayDisclosure } from '@/components/ui/useOverlayDisclosure';
import type { AdminUserTransferRequest } from '@/lib/admin/users';
import type { Space } from '@/lib/spaces/types';
import type { Service } from '@/lib/services/types';

interface SettingsOverlayProps {
  isOpen: boolean;
  closing: boolean;
  activeTab: SettingsTab;
  user?: Session['user'];
  minecraftStatus: MineVerifyPublicStatus;
  minecraftLoading: boolean;
  theme: AppTheme;
  onClose: () => void;
  onTabChange: (tab: SettingsTab) => void;
  onLinkMinecraft: () => void;
  onSignIn: () => void;
  onSignOut: () => void;
  onThemeChange: (theme: AppTheme) => void;
  onUnlinkMinecraft: () => void;
  onOpenContent: (item: Place | Portal, type: DestinationType) => void;
  onOpenService: (service: Service) => void;
  onOpenSpace: (space: Space) => void;
}

export default function SettingsOverlay({
  isOpen,
  closing,
  activeTab,
  user,
  minecraftStatus,
  minecraftLoading,
  theme,
  onClose,
  onTabChange,
  onLinkMinecraft,
  onSignIn,
  onSignOut,
  onThemeChange,
  onUnlinkMinecraft,
  onOpenContent,
  onOpenService,
  onOpenSpace,
}: SettingsOverlayProps) {
  const hasAdminAccess = isAdministrationRole(user?.role);
  const {
    close: closeTransferOverlay,
    isClosing: transferOverlayClosing,
    isOpen: transferOverlayOpen,
    open: openTransferOverlay,
  } = useOverlayDisclosure();
  const [transferRequest, setTransferRequest] =
    useState<AdminUserTransferRequest | null>(null);
  const [adminUsersRefreshVersion, setAdminUsersRefreshVersion] = useState(0);
  const adminUsersRefreshKey = `${minecraftStatus.status === 'linked'
    ? `${minecraftStatus.minecraftUuid ?? ''}:${minecraftStatus.minecraftName ?? ''}`
    : 'unlinked'}:${adminUsersRefreshVersion}`;
  const openTransfer = useCallback((request: AdminUserTransferRequest) => {
    setTransferRequest(request);
    openTransferOverlay();
  }, [openTransferOverlay]);
  const completeTransfer = useCallback(() => {
    setAdminUsersRefreshVersion((current) => current + 1);
    closeTransferOverlay();
  }, [closeTransferOverlay]);
  const tabs = useMemo(
    () => [
      { id: 'account' as const, label: 'Compte' },
      { id: 'appearance' as const, label: 'Apparence' },
      { id: 'credits' as const, label: 'Tech Stack' },
      ...(hasAdminAccess
        ? [{ id: 'admin' as const, label: 'Administration' }]
        : []),
    ],
    [hasAdminAccess],
  );

  useEffect(() => {
    if (activeTab === 'admin' && !hasAdminAccess) {
      onTabChange('account');
    }
  }, [activeTab, hasAdminAccess, onTabChange]);

  return (
    <>
      <OverlayPanel
        isOpen={isOpen}
        closing={closing}
        contentMode="contained"
        onClose={onClose}
        size="large"
        title="Paramètres"
      >
        <OverlaySlider
          activeValue={activeTab}
          onChange={onTabChange}
          tabs={tabs.map((tab) => ({ value: tab.id, label: tab.label }))}
          slides={tabs.map((tab) => ({
            value: tab.id,
            className: 'pt-20',
            content: (
              <>
                {tab.id === 'account' && (
                  <AccountSettings
                    user={user}
                    minecraftStatus={minecraftStatus}
                    minecraftLoading={minecraftLoading}
                    onLinkMinecraft={onLinkMinecraft}
                    onSignIn={onSignIn}
                    onSignOut={onSignOut}
                    onUnlinkMinecraft={onUnlinkMinecraft}
                    onOpenContent={onOpenContent}
                    onOpenService={onOpenService}
                    onOpenSpace={onOpenSpace}
                  />
                )}
                {tab.id === 'appearance' && (
                  <AppearanceSettings theme={theme} onThemeChange={onThemeChange} />
                )}
                {tab.id === 'credits' && <CreditsSettings />}
                {tab.id === 'admin' && (
                  <AdminSettings
                    onTransferRequired={openTransfer}
                    usersRefreshKey={adminUsersRefreshKey}
                  />
                )}
              </>
            ),
          }))}
        />
      </OverlayPanel>

      <AdminUserTransferOverlay
        request={transferRequest}
        isOpen={transferOverlayOpen}
        closing={transferOverlayClosing}
        onClose={closeTransferOverlay}
        onComplete={completeTransfer}
      />
    </>
  );
}
