'use client';

import { useCallback, useEffect, useState } from 'react';
import SyncNotification from './SyncNotification';
import ManualPositionInput from './position/ManualPositionInput';
import PlayerPositionView from './position/PlayerPositionView';
import PositionPanelAnimations from './position/PositionPanelAnimations';
import PositionPanelHeader from './position/PositionPanelHeader';
import type { ManualCoords, ManualWorld } from './position/position-types';
import { themeColors } from '../lib/theme-colors';
import {
  getPlayerCoordsErrorMessage,
  playerCoordsApi,
  PlayerCoordsApiError,
  type PlayerData,
} from '../lib/playercoords-api';

interface PositionPanelProps {
  onPlayerPositionChange?: (position: { x: number; y: number; z: number; world: string } | null) => void;
  onManualCoordsChange?: (coords: { x: string; y: string; z: string; world: ManualWorld }) => void;
}

export default function PositionPanel({
  onPlayerPositionChange,
  onManualCoordsChange,
}: PositionPanelProps) {
  const [playerData, setPlayerData] = useState<PlayerData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [manualCoords, setManualCoords] = useState<ManualCoords>({ x: '', y: '', z: '' });
  const [manualWorld, setManualWorld] = useState<ManualWorld>('overworld');
  const [isShaking, setIsShaking] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [isNewConnection, setIsNewConnection] = useState(false);

  const syncPosition = useCallback(async (isAutoSync = false) => {
    if (!isAutoSync) {
      setIsLoading(true);
    }

    try {
      const data = await playerCoordsApi.getCoords();
      if (!isConnected && !isAutoSync) {
        setIsNewConnection(true);
        setTimeout(() => setIsNewConnection(false), 500);
      }
      setPlayerData(data);
      setIsConnected(true);
    } catch (err) {
      handleSyncError(err, isAutoSync, setSyncError, setIsShaking);
      setIsConnected(false);
      setPlayerData(null);
    } finally {
      if (!isAutoSync) {
        setIsLoading(false);
      }
    }
  }, [isConnected]);

  const disconnect = () => {
    setIsConnected(false);
    setPlayerData(null);
  };

  useEffect(() => {
    if (!isConnected) return;

    const interval = setInterval(() => syncPosition(true), 2000);
    return () => clearInterval(interval);
  }, [isConnected, syncPosition]);

  useEffect(() => {
    onPlayerPositionChange?.(playerData ? {
      x: playerData.x,
      y: playerData.y,
      z: playerData.z,
      world: playerData.world,
    } : null);
  }, [playerData, onPlayerPositionChange]);

  useEffect(() => {
    onManualCoordsChange?.({
      x: manualCoords.x,
      y: manualCoords.y,
      z: manualCoords.z,
      world: manualWorld,
    });
  }, [manualCoords, manualWorld, onManualCoordsChange]);

  return (
    <>
      <PositionPanelAnimations />
      <div className="fixed top-4 right-4 w-80 z-50">
        <div className={`${themeColors.panel.primary} ${themeColors.blur} ${themeColors.shadow.panel} ${themeColors.util.roundedXl} border ${themeColors.border.primary} ${themeColors.transition}`}>
          <ServerLogo />
          <PositionPanelHeader
            isConnected={isConnected}
            isLoading={isLoading}
            isShaking={isShaking}
            onDisconnect={disconnect}
            onSync={() => syncPosition()}
          />
          <div className={`p-4 space-y-3 ${themeColors.panel.primary} ${themeColors.blurSm} rounded-b-xl ${themeColors.transition}`}>
            {playerData ? (
              <PlayerPositionView playerData={playerData} isNewConnection={isNewConnection} />
            ) : (
              <ManualPositionInput
                coords={manualCoords}
                world={manualWorld}
                onCoordsChange={setManualCoords}
                onWorldChange={setManualWorld}
              />
            )}
          </div>
        </div>
      </div>
      <SyncNotification
        error={syncError}
        onClose={() => setSyncError(null)}
        topOffset={playerData ? '350px' : '270px'}
      />
    </>
  );
}

function ServerLogo() {
  return (
    <div className={`p-4 flex justify-center ${themeColors.panel.primary} ${themeColors.blurSm} rounded-t-xl border-b ${themeColors.border.primary} ${themeColors.transition}`}>
      <a href="https://play-mc.fr" target="_blank" rel="noopener noreferrer">
        <img
          src="/pmc_logo.png"
          alt="Server Logo"
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

function triggerSyncError(
  message: string,
  setSyncError: (message: string) => void,
  setIsShaking: (isShaking: boolean) => void
) {
  setSyncError(message);
  setIsShaking(true);
  setTimeout(() => setIsShaking(false), 500);
}
