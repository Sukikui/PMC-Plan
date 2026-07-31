'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { signIn, signOut, useSession } from 'next-auth/react';
import type { Place, Portal } from '@/lib/api/types';
import AddContentButton from '@/components/AddContentButton';
import BigPlusIcon from '@/components/icons/BigPlusIcon';
import BigTradeIcon from '@/components/icons/BigTradeIcon';
import CrossIcon from '@/components/icons/CrossIcon';
import MapIcon from '@/components/icons/MapIcon';
import PlusIcon from '@/components/icons/PlusIcon';
import SettingsIcon from '@/components/icons/SettingsIcon';
import SpacesIcon from '@/components/icons/SpacesIcon';
import SettingsAccountSummary from '@/components/settings/panel/SettingsAccountSummary';
import {
  rememberSettingsOverlayForAuthReturn,
  useSettingsOverlay,
} from '@/components/settings/SettingsOverlayProvider';
import ThemeSelector from '@/components/settings/ThemeSelector';
import { useMinecraftLink } from '@/components/settings/useMinecraftLink';
import { useOverlay } from '@/components/overlay/OverlayProvider';
import IconActionButton from '@/components/ui/IconActionButton';
import IconButtonRound from '@/components/ui/IconButtonRound';
import Panel from '@/components/ui/Panel';
import { PillActionButton } from '@/components/ui/PillAction';
import SectionSeparator from '@/components/ui/SectionSeparator';
import { useOverlayDisclosure } from '@/components/ui/useOverlayDisclosure';
import { themeColors } from '@/lib/theme-colors';
import { useTheme } from '@/lib/use-theme';
import type {
  DestinationType,
  SelectDestinationHandler,
} from '@/lib/destination/selection';
import type { Service } from '@/lib/services/types';

const MinecraftLinkOverlay = dynamic(() => import('@/components/settings/MinecraftLinkOverlay'));
const SettingsOverlay = dynamic(() => import('@/components/settings/overlay/SettingsOverlay'));

interface SettingsPanelProps {
  onExpandedChange?: (expanded: boolean) => void;
  onLinkedMinecraftUuidChange?: (uuid: string | null) => void;
  onOpenMarket?: () => void;
  onOpenNetherMap?: () => void;
  onOpenSpaces?: () => void;
  onSelectItem?: SelectDestinationHandler;
}

const GAP = 16;
const STACK_GAP = 8;
const TRIGGER = 48;

export default function SettingsPanel({
  onExpandedChange,
  onLinkedMinecraftUuidChange,
  onOpenMarket,
  onOpenNetherMap,
  onOpenSpaces,
  onSelectItem,
}: SettingsPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [panelHeight, setPanelHeight] = useState(0);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const settingsOverlay = useSettingsOverlay();
  const minecraftOverlay = useOverlayDisclosure();
  const { theme, changeTheme } = useTheme();
  const { data: session } = useSession();
  const {
    openFormOverlay,
    openPlaceInfo,
    openSpaceInfo,
  } = useOverlay();
  const minecraftLink = useMinecraftLink(
    Boolean(session?.user),
    settingsOverlay.isOpen || minecraftOverlay.isOpen,
  );
  const linkedMinecraftUuid = minecraftLink.status.status === 'linked'
    ? minecraftLink.status.minecraftUuid ?? null
    : null;

  useEffect(() => {
    onLinkedMinecraftUuidChange?.(linkedMinecraftUuid);
  }, [linkedMinecraftUuid, onLinkedMinecraftUuidChange]);

  useEffect(() => {
    onExpandedChange?.(isExpanded);
  }, [isExpanded, onExpandedChange]);

  useEffect(() => {
    if (!isExpanded) return;
    const measure = () => {
      if (panelRef.current) setPanelHeight(panelRef.current.getBoundingClientRect().height);
    };
    const timeoutId = setTimeout(measure, 0);
    window.addEventListener('resize', measure);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', measure);
    };
  }, [isExpanded, minecraftLink.status.status, session?.user]);

  const openMinecraftLink = () => {
    minecraftOverlay.open();
    void minecraftLink.startRequest();
  };

  const signInFromSettings = () => {
    rememberSettingsOverlayForAuthReturn();
    void signIn('discord');
  };

  const openAccountContent = (
    item: Place | Portal,
    type: DestinationType,
  ) => {
    openPlaceInfo(item, type, onSelectItem);
  };
  const openAccountService = (service: Service) => {
    openFormOverlay({
      initialData: {
        ...service,
        canDelete: service.primaryManagerId === session?.user?.id,
        type: 'service',
      },
      mode: 'edit',
    });
  };

  return (
    <>
      <div data-map-panel className={`fixed bottom-4 right-4 z-50 max-w-[calc(100vw-2rem)] transition-all duration-500 ease-out ${isExpanded ? 'w-80' : ''}`}>
        <div
          className="absolute right-0 z-10"
          style={{ bottom: isExpanded ? panelHeight + GAP : TRIGGER + STACK_GAP }}
        >
          <div className="flex flex-col items-end gap-2">
            <IconButtonRound onClick={onOpenNetherMap} aria-label="Ouvrir la carte du Nether">
              <MapIcon className={`h-6 w-6 ${themeColors.text.secondary}`} />
            </IconButtonRound>
            <IconButtonRound onClick={onOpenSpaces} aria-label="Explorer les espaces">
              <SpacesIcon className={`h-6 w-6 ${themeColors.text.secondary}`} />
            </IconButtonRound>
            <IconButtonRound onClick={onOpenMarket} aria-label="Ouvrir la place de marché">
              <BigTradeIcon className={`h-6 w-6 ${themeColors.text.secondary}`} />
            </IconButtonRound>
          </div>
        </div>

        {!isExpanded ? (
          <IconButtonRound onClick={() => setIsExpanded(true)} aria-label="Ouvrir les paramètres">
            <BigPlusIcon className={`h-6 w-6 ${themeColors.text.secondary}`} />
          </IconButtonRound>
        ) : (
          <div ref={panelRef}>
            <Panel>
              <div className="space-y-4 p-4">
                <div className="flex items-center justify-between gap-3">
                  <ThemeSelector value={theme} onChange={changeTheme} showLabel={false} />
                  <IconActionButton onClick={() => setIsExpanded(false)} aria-label="Fermer">
                    <CrossIcon className={`h-4 w-4 ${themeColors.text.secondary}`} />
                  </IconActionButton>
                </div>
                <div className="-mx-4"><SectionSeparator /></div>
                <SettingsAccountSummary
                  user={session?.user}
                  minecraftStatus={minecraftLink.status}
                  onOpenSettings={() => settingsOverlay.open('account')}
                />
                <div className="-mx-4"><SectionSeparator /></div>
                <div className="grid gap-1">
                  <PillActionButton
                    fullWidth
                    onClick={() => settingsOverlay.open()}
                    className="h-10 !py-0"
                  >
                    <span className="flex w-6 shrink-0 justify-center">
                      <SettingsIcon className="h-4 w-4" />
                    </span>
                    Gérer les paramètres
                  </PillActionButton>
                  <AddContentButton fullWidth className="h-10 !py-0">
                    <span className="flex w-6 shrink-0 justify-center">
                      <PlusIcon className="h-6 w-6" />
                    </span>
                    Ajouter du contenu
                  </AddContentButton>
                </div>
              </div>
            </Panel>
          </div>
        )}
      </div>

      {settingsOverlay.isOpen && (
        <SettingsOverlay
          activeTab={settingsOverlay.activeTab}
          isOpen={settingsOverlay.isOpen}
          closing={settingsOverlay.isClosing}
          user={session?.user}
          minecraftStatus={minecraftLink.status}
          minecraftLoading={minecraftLink.loading}
          theme={theme}
          onClose={settingsOverlay.close}
          onTabChange={settingsOverlay.setActiveTab}
          onLinkMinecraft={openMinecraftLink}
          onSignIn={signInFromSettings}
          onSignOut={() => void signOut()}
          onThemeChange={changeTheme}
          onUnlinkMinecraft={() => void minecraftLink.unlinkAccount()}
          onOpenContent={openAccountContent}
          onOpenService={openAccountService}
          onOpenSpace={openSpaceInfo}
        />
      )}

      {minecraftOverlay.isOpen && (
        <MinecraftLinkOverlay
          isOpen={minecraftOverlay.isOpen}
          closing={minecraftOverlay.isClosing}
          status={minecraftLink.status}
          loading={minecraftLink.loading}
          error={minecraftLink.error}
          onClose={minecraftOverlay.close}
          onRetry={() => void minecraftLink.startRequest()}
        />
      )}
    </>
  );
}
