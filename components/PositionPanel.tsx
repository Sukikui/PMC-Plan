'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSettingsOverlay } from '@/components/settings/SettingsOverlayProvider';
import AdminApprovalNotification from '@/components/admin/AdminApprovalNotification';
import SyncNotification from './SyncNotification';
import ManualPositionInput from './position/ManualPositionInput';
import PlayerPositionView from './position/PlayerPositionView';
import PositionSyncButton from './position/PositionSyncButton';
import Panel from './ui/Panel';
import type { ManualCoords, ManualWorld } from './position/position-types';
import { themeColors } from '../lib/theme-colors';
import {
  MAP_CONTROL_PANEL_COLLAPSED_HEIGHT_PX,
  MAP_CONTROL_PANEL_EXPANSION_TRANSITION_MS,
} from '../lib/ui/panel';
import {
  getPlayerCoordsErrorMessage,
  isSafariPlayerCoordsSyncBlocked,
  playerCoordsApi,
  PlayerCoordsApiError,
  PlayerCoordsApiErrorType,
  type PlayerData,
} from '../lib/playercoords-api';
import { normalizeWorldName } from '../lib/world-utils';

const POSITION_PANEL_TOP_PX = 16;
const NOTIFICATION_GAP_PX = 8;
const PLAYER_PLOP_TRANSITION_MS = 120;
const PLAYER_REVEAL_DELAY_MS = 70;
const SAFARI_SYNC_ERROR = 'Synchronisation indisponible sur Safari';

interface PositionPanelProps {
  onPlayerPositionChange?: (position: PlayerData | null) => void;
  onManualCoordsChange?: (coords: { x: string; y: string; z: string; world: ManualWorld }) => void;
}

export default function PositionPanel({
  onPlayerPositionChange,
  onManualCoordsChange,
}: PositionPanelProps) {
  const [playerData, setPlayerData] = useState<PlayerData | null>(null);
  const [previewUsername, setPreviewUsername] = useState<string | null>(null);
  const [previewExpanded, setPreviewExpanded] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [manualCoords, setManualCoords] = useState<ManualCoords>({ x: '', y: '', z: '' });
  const [manualWorld, setManualWorld] = useState<ManualWorld>('overworld');
  const [isShaking, setIsShaking] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const { open: openSettings } = useSettingsOverlay();
  const isConnected = Boolean(playerData);
  const playerUsername = playerData?.username ?? null;

  useEffect(() => {
    if (playerUsername) setPreviewUsername(playerUsername);
  }, [playerUsername]);

  useEffect(() => {
    if (isConnected) {
      if (!previewUsername) return;

      let revealTimeout: ReturnType<typeof setTimeout>;
      const expansionFrame = requestAnimationFrame(() => {
        setPreviewExpanded(true);
        revealTimeout = setTimeout(
          () => setPreviewVisible(true),
          PLAYER_REVEAL_DELAY_MS,
        );
      });

      return () => {
        cancelAnimationFrame(expansionFrame);
        clearTimeout(revealTimeout);
      };
    }

    setPreviewVisible(false);
    setPreviewExpanded(false);
    const clearTimeoutId = previewUsername
      ? setTimeout(
        () => setPreviewUsername(null),
        Math.max(
          PLAYER_PLOP_TRANSITION_MS,
          MAP_CONTROL_PANEL_EXPANSION_TRANSITION_MS,
        ),
      )
      : undefined;
    return () => clearTimeout(clearTimeoutId);
  }, [isConnected, previewUsername]);

  const syncPosition = useCallback(async (isAutoSync = false) => {
    if (!isAutoSync && isSafariPlayerCoordsSyncBlocked()) {
      triggerSyncError(SAFARI_SYNC_ERROR, setSyncError, setIsShaking);
      return;
    }

    if (!isAutoSync) {
      setIsLoading(true);
    }

    try {
      const data = await playerCoordsApi.getCoords();
      const nextWorld = normalizeWorldName(data.world);
      const nextCoords = {
        x: String(Math.floor(data.x)),
        y: String(Math.floor(data.y)),
        z: String(Math.floor(data.z)),
      };
      setManualCoords((current) => (
        current.x === nextCoords.x
        && current.y === nextCoords.y
        && current.z === nextCoords.z
          ? current
          : nextCoords
      ));
      if (nextWorld) setManualWorld(nextWorld);
      setPlayerData((current) => isSamePlayerData(current, data) ? current : data);
    } catch (err) {
      if (!isAutoSync && isMissingPlayerCoordsMod(err)) {
        setSyncError(null);
        openSettings('appearance');
      } else {
        handleSyncError(err, isAutoSync, setSyncError, setIsShaking);
      }
      setPlayerData(null);
    } finally {
      if (!isAutoSync) {
        setIsLoading(false);
      }
    }
  }, [openSettings]);

  const disconnect = () => {
    setPlayerData(null);
  };

  useEffect(() => {
    if (!isConnected) return;

    let cancelled = false;
    let timeout: ReturnType<typeof setTimeout>;
    const poll = async () => {
      await syncPosition(true);
      if (!cancelled) timeout = setTimeout(poll, 2000);
    };

    timeout = setTimeout(poll, 2000);
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [isConnected, syncPosition]);

  useEffect(() => {
    onPlayerPositionChange?.(playerData);
  }, [playerData, onPlayerPositionChange]);

  useEffect(() => {
    if (playerData) return;
    onManualCoordsChange?.({
      x: manualCoords.x,
      y: manualCoords.y,
      z: manualCoords.z,
      world: manualWorld,
    });
  }, [manualCoords, manualWorld, onManualCoordsChange, playerData]);

  const syncAction = (
    <PositionSyncButton
      isConnected={isConnected}
      isLoading={isLoading}
      isShaking={isShaking}
      onDisconnect={disconnect}
      onSync={() => syncPosition()}
    />
  );

  return (
    <>
      <Panel
        data-map-panel
        className={`fixed right-4 top-4 z-50 flex max-w-[calc(100vw-2rem)] justify-end overflow-hidden ${
          previewExpanded
            ? 'w-[min(20rem,calc(100vw-2rem))] sm:w-[29rem]'
            : 'w-[min(20rem,calc(100vw-2rem))]'
        }`}
        style={{
          height: `${MAP_CONTROL_PANEL_COLLAPSED_HEIGHT_PX}px`,
          transitionDuration: `${MAP_CONTROL_PANEL_EXPANSION_TRANSITION_MS}ms`,
          transitionProperty: 'width',
          transitionTimingFunction: 'ease-out',
          willChange: 'width',
        }}
      >
        <div className="flex w-full shrink-0 flex-col sm:w-80">
          <ServerLogo />
          <div className="flex min-h-0 flex-1 overflow-y-auto px-4">
            <div className="h-full w-full">
              <ManualPositionInput
                action={syncAction}
                coords={manualCoords}
                readOnly={Boolean(playerData)}
                world={manualWorld}
                onCoordsChange={setManualCoords}
                onWorldChange={setManualWorld}
              />
            </div>
          </div>
        </div>
        {previewUsername && (
          <PlayerPositionView
            username={previewUsername}
            transitionDuration={PLAYER_PLOP_TRANSITION_MS}
            visible={previewVisible}
          />
        )}
      </Panel>
      <div
        className="pointer-events-none fixed right-4 z-50 flex w-[calc(100vw-2rem)] max-w-80 flex-col gap-2"
        style={{
          top:
          POSITION_PANEL_TOP_PX
          + MAP_CONTROL_PANEL_COLLAPSED_HEIGHT_PX
          + NOTIFICATION_GAP_PX,
        }}
      >
        <SyncNotification
          error={syncError}
          onClose={() => setSyncError(null)}
        />
        <AdminApprovalNotification />
      </div>
    </>
  );
}

function ServerLogo() {
  return (
    <div className={`flex justify-center border-b p-4 ${themeColors.border.primary}`}>
      <a href="https://play-mc.fr" target="_blank" rel="noopener noreferrer">
        <img
          src="/branding/pmc/logo.png"
          alt="Logo de Play-MC.fr"
          className="h-12 w-auto object-contain"
          onError={(event) => {
            event.currentTarget.style.display = 'none';
          }}
        />
      </a>
    </div>
  );
}

function handleSyncError(
  error: unknown,
  isAutoSync: boolean,
  setSyncError: (message: string) => void,
  setIsShaking: (isShaking: boolean) => void
) {
  if (error instanceof PlayerCoordsApiError) {
    if (error.type === 'UNKNOWN') {
      console.error('Unexpected PlayerCoordsAPI error:', {
        error,
        type: error.type,
        message: error.originalMessage,
      });
    }

    if (!isAutoSync) {
      triggerSyncError(getPlayerCoordsErrorMessage(error), setSyncError, setIsShaking);
    }
    return;
  }

  console.error('Unexpected sync error:', error);
  if (!isAutoSync) {
    triggerSyncError('Erreur inconnue', setSyncError, setIsShaking);
  }
}

function isMissingPlayerCoordsMod(error: unknown) {
  return error instanceof PlayerCoordsApiError
    && error.type === PlayerCoordsApiErrorType.CONNECTION_FAILED;
}

function isSamePlayerData(current: PlayerData | null, next: PlayerData) {
  return current?.x === next.x
    && current.y === next.y
    && current.z === next.z
    && current.world === next.world
    && current.uuid === next.uuid
    && current.username === next.username;
}

function triggerSyncError(
  message: string,
  setSyncError: (message: string) => void,
  setIsShaking: (isShaking: boolean) => void
) {
  setSyncError(message);
  setIsShaking(true);
  setTimeout(() => setIsShaking(false), 500);
}
