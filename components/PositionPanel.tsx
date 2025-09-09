'use client';

import { useState, useEffect, useCallback } from 'react';
import SyncNotification from './SyncNotification';
import { themeColors } from '../lib/theme-colors';
import { getRenderUrl } from '../lib/starlight-skin-api';
import { playerCoordsApi, PlayerData, PlayerCoordsApiError, getPlayerCoordsErrorMessage } from '../lib/playercoords-api';

interface PositionPanelProps {
  onPlayerPositionChange?: (position: {x: number; y: number; z: number; world: string} | null) => void;
  onManualCoordsChange?: (coords: {x: string; y: string; z: string; world: 'overworld' | 'nether'}) => void;
}

export default function PositionPanel({ 
  onPlayerPositionChange,
  onManualCoordsChange 
}: PositionPanelProps) {
  
  const [playerData, setPlayerData] = useState<PlayerData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [manualCoords, setManualCoords] = useState({ x: '', y: '', z: '' });
  const [manualWorld, setManualWorld] = useState<'overworld' | 'nether'>('overworld');
  const [isShaking, setIsShaking] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [isNewConnection, setIsNewConnection] = useState(false);

  const syncPosition = useCallback(async (isAutoSync = false) => {
    if (!isAutoSync) {
      setIsLoading(true);
    }

    try {
      const data = await playerCoordsApi.getCoords();
      
      // Trigger blue halo effect for new connections
      if (!isConnected && !isAutoSync) {
        setIsNewConnection(true);
        setTimeout(() => setIsNewConnection(false), 500);
      }
      
      setPlayerData(data);
      setIsConnected(true);
    } catch (err) {
      if (err instanceof PlayerCoordsApiError) {
        const errorMessage = getPlayerCoordsErrorMessage(err);

        // Only log unexpected errors
        if (err.type === 'UNKNOWN') {
          console.error('Unexpected PlayerCoordsAPI error:', {
            error: err,
            type: err.type,
            message: err.originalMessage
          });
        }

        setIsConnected(false);
        setPlayerData(null);

        if (!isAutoSync) {
          setSyncError(errorMessage);
          
          setIsShaking(true);
          setTimeout(() => setIsShaking(false), 500);
        }
      } else {
        // Fallback for non-PlayerCoordsApiError
        console.error('Unexpected sync error:', err);
        setIsConnected(false);
        setPlayerData(null);

        if (!isAutoSync) {
          setSyncError('Erreur inconnue');
          
          setIsShaking(true);
          setTimeout(() => setIsShaking(false), 500);
        }
      }
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

  // Auto-sync every 2 seconds when connected
  useEffect(() => {
    if (!isConnected) return;

    const interval = setInterval(() => syncPosition(true), 2000);
    return () => clearInterval(interval);
  }, [isConnected, syncPosition]);

  // Notify parent component of player position changes
  useEffect(() => {
    if (playerData && onPlayerPositionChange) {
      onPlayerPositionChange({
        x: playerData.x,
        y: playerData.y,
        z: playerData.z,
        world: playerData.world
      });
    } else if (!playerData && onPlayerPositionChange) {
      onPlayerPositionChange(null);
    }
  }, [playerData, onPlayerPositionChange]);

  // Notify parent component of manual coords changes
  useEffect(() => {
    if (onManualCoordsChange) {
      onManualCoordsChange({
        x: manualCoords.x,
        y: manualCoords.y,
        z: manualCoords.z,
        world: manualWorld
      });
    }
  }, [manualCoords, manualWorld, onManualCoordsChange]);


  return (
    <>
      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
          20%, 40%, 60%, 80% { transform: translateX(2px); }
        }
        @keyframes blueGlow {
          0% { 
            border-color: rgb(59 130 246 / 0.8);
            box-shadow: 0 0 0 0 rgb(59 130 246 / 0.4);
          }
          50% { 
            border-color: rgb(59 130 246 / 0.4);
            box-shadow: 0 0 0 4px rgb(59 130 246 / 0.1);
          }
          100% { 
            border-color: rgb(229 231 235 / 0.5);
            box-shadow: 0 0 0 0 rgb(59 130 246 / 0);
          }
        }
        @keyframes blueGlowDark {
          0% { 
            border-color: rgb(59 130 246 / 0.8);
            box-shadow: 0 0 0 0 rgb(59 130 246 / 0.4);
          }
          50% { 
            border-color: rgb(59 130 246 / 0.4);
            box-shadow: 0 0 0 4px rgb(59 130 246 / 0.1);
          }
          100% { 
            border-color: rgb(75 85 99 / 0.5);
            box-shadow: 0 0 0 0 rgb(59 130 246 / 0);
          }
        }
      `}</style>
      <div className="fixed top-4 right-4 w-80 z-50">
        <div className={`${themeColors.panel.primary} ${themeColors.blur} ${themeColors.shadow.panel} ${themeColors.util.roundedXl} border ${themeColors.border.primary} ${themeColors.transition}`}>

      {/* Server Logo */}
      <div className={`p-4 flex justify-center ${themeColors.panel.primary} ${themeColors.blurSm} rounded-t-xl border-b ${themeColors.border.primary} ${themeColors.transition}`}>
        <a href="https://play-mc.fr" target="_blank" rel="noopener noreferrer">
          <img 
            src="/pmc_logo.png" 
            alt="Server Logo" 
            className="h-12 w-auto object-contain"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </a>
      </div>
      
      {/* Header with sync button */}
      <div className={`p-4 border-b ${themeColors.border.primary} ${themeColors.panel.primary} ${themeColors.blurSm} ${themeColors.transition}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 ${themeColors.util.roundedFull} ${isConnected ? `${themeColors.status.connected} ${themeColors.util.animatePulse}` : themeColors.status.disconnected}`}></div>
            <h2 className={`text-xs font-semibold ${themeColors.text.secondary} ${themeColors.util.uppercase} ${themeColors.transition}`}>Position du Client</h2>
          </div>
          
          <button
            onClick={isConnected ? disconnect : () => syncPosition()}
            disabled={isLoading}
            className={`px-3 py-1.5 text-xs ${themeColors.util.roundedLg} font-medium ${themeColors.transitionAll} ${
              isLoading
                ? `${themeColors.interactive.disabled} cursor-not-allowed`
                : isConnected
                ? `${themeColors.button.danger} ${themeColors.util.activeScale}`
                : `${themeColors.button.primary} ${themeColors.util.activeScale}`
            } ${
              isShaking ? themeColors.util.animatePulse : ''
            }`}
            style={{
              animation: isShaking ? 'shake 0.5s ease-in-out' : undefined
            }}
          >
            {isLoading ? (
              <div className="flex items-center gap-1">
                <div className={`w-3 h-3 border ${themeColors.text.secondary} border-t-transparent ${themeColors.util.roundedFull} ${themeColors.util.animateSpin}`}></div>
                Sync...
              </div>
            ) : isConnected ? (
              'Désynchroniser'
            ) : (
              'Synchroniser'
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className={`p-4 space-y-3 ${themeColors.panel.primary} ${themeColors.blurSm} rounded-b-xl ${themeColors.transition}`}>
        {playerData ? (
          <>
            {/* Player name */}
            <div 
              className={`${themeColors.panel.primary} ${themeColors.blurSm} ${themeColors.util.roundedLg} p-3 border ${themeColors.border.primary} ${isNewConnection ? '' : themeColors.transition}`}
              style={{
                animation: isNewConnection ? 'blueGlow 0.5s ease-out' : undefined,
                animationName: isNewConnection ? (document.documentElement.classList.contains('dark') ? 'blueGlowDark' : 'blueGlow') : undefined
              }}
            >
              <div className="flex items-center gap-6">
                <div className="relative w-16 h-16 overflow-hidden ml-2">
                  <img 
                    src={getRenderUrl(playerData.uuid, {
                      renderType: 'ultimate',
                      crop: 'face',
                      borderHighlight: true,
                      borderHighlightRadius: 7, 
                      dropShadow: true,
                    })}
                    alt={`Skin de ${playerData.username}`}
                    className="w-full h-full object-cover"
                    style={{ imageRendering: 'pixelated' }}
                    crossOrigin="anonymous"
                    loading="eager"
                  />
                  {/* Gradient fade to panel background color */}
                  <div className="absolute inset-x-0 bottom-0 h-3 bg-gradient-to-t from-white/90 to-transparent dark:from-gray-900/95 dark:to-transparent pointer-events-none"></div>
                </div>
                <div>
                  <div className={`text-sm font-medium ${themeColors.text.primary} ${themeColors.transition}`}>{playerData.username}</div>
                  <div className={`text-xs ${themeColors.text.tertiary} mt-1.5 ${themeColors.transition}`}>UUID: {playerData.uuid.substring(0, 8)}...</div>
                </div>
              </div>
            </div>

            {/* World selector */}
            <div className="flex gap-1">
              <button
                className={`px-2 py-1 text-xs ${themeColors.util.roundedFull} font-medium ${themeColors.transition} ${
                  (playerData.world === 'overworld' || playerData.world === 'minecraft:overworld')
                    ? themeColors.world.overworld
                    : `${themeColors.button.ghost}`
                }`}
                disabled
              >
                overworld
              </button>
              <button
                className={`px-2 py-1 text-xs ${themeColors.util.roundedFull} font-medium ${themeColors.transition} ${
                  (playerData.world === 'nether' || playerData.world === 'minecraft:the_nether')
                    ? themeColors.world.nether
                    : `${themeColors.button.ghost}`
                }`}
                disabled
              >
                nether
              </button>
            </div>

            {/* Coordinates */}
            <div className="flex items-center gap-3">
              <label className={`text-xs font-medium ${themeColors.text.quaternary} w-4 text-center ${themeColors.transition}`}>X</label>
              <div className={`w-16 px-2 py-1 text-xs ${themeColors.text.primary} ${themeColors.input.base} border rounded ${themeColors.transition}`}>
                {Math.floor(playerData.x)}
              </div>
              <label className={`text-xs font-medium ${themeColors.text.quaternary} w-4 text-center ${themeColors.transition}`}>Y</label>
              <div className={`w-16 px-2 py-1 text-xs ${themeColors.text.primary} ${themeColors.input.base} border rounded ${themeColors.transition}`}>
                {Math.floor(playerData.y)}
              </div>
              <label className={`text-xs font-medium ${themeColors.text.quaternary} w-4 text-center ${themeColors.transition}`}>Z</label>
              <div className={`w-16 px-2 py-1 text-xs ${themeColors.text.primary} ${themeColors.input.base} border rounded mr-3 ${themeColors.transition}`}>
                {Math.floor(playerData.z)}
              </div>
            </div>
          </>
        ) : (
          <div className="space-y-4">
            {/* World selector */}
            <div className="flex gap-1">
              <button
                onClick={() => setManualWorld('overworld')}
                className={`px-2 py-1 text-xs ${themeColors.util.roundedFull} font-medium ${themeColors.transition} ${
                  manualWorld === 'overworld'
                    ? themeColors.world.overworld
                    : `${themeColors.button.ghost} ${themeColors.interactive.hover}`
                }`}
              >
                overworld
              </button>
              <button
                onClick={() => setManualWorld('nether')}
                className={`px-2 py-1 text-xs ${themeColors.util.roundedFull} font-medium ${themeColors.transition} ${
                  manualWorld === 'nether'
                    ? themeColors.world.nether
                    : `${themeColors.button.ghost} ${themeColors.interactive.hover}`
                }`}
              >
                nether
              </button>
            </div>

            {/* Coordinates input */}
            <div className="flex items-center gap-3">
              <label className={`text-xs font-medium ${themeColors.text.quaternary} w-4 text-center ${themeColors.transition}`}>X</label>
              <input
                type="number"
                value={manualCoords.x}
                onChange={(e) => setManualCoords(prev => ({ ...prev, x: e.target.value }))}
                placeholder="0"
                className={`w-16 px-2 py-1 text-xs ${themeColors.input.base} border rounded focus:outline-none focus:ring-2 ${themeColors.transition} ${themeColors.placeholder} [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
              />
              <label className={`text-xs font-medium ${themeColors.text.quaternary} w-4 text-center ${themeColors.transition}`}>Y</label>
              <input
                type="number"
                value={manualCoords.y}
                onChange={(e) => setManualCoords(prev => ({ ...prev, y: e.target.value }))}
                placeholder="64"
                className={`w-16 px-2 py-1 text-xs ${themeColors.input.base} border rounded focus:outline-none focus:ring-2 ${themeColors.transition} ${themeColors.placeholder} [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
              />
              <label className={`text-xs font-medium ${themeColors.text.quaternary} w-4 text-center ${themeColors.transition}`}>Z</label>
              <input
                type="number"
                value={manualCoords.z}
                onChange={(e) => setManualCoords(prev => ({ ...prev, z: e.target.value }))}
                placeholder="0"
                className={`w-16 px-2 py-1 text-xs ${themeColors.input.base} border rounded focus:outline-none focus:ring-2 ${themeColors.transition} ${themeColors.placeholder} [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none mr-3`}
              />
            </div>
          </div>
        )}
      </div>
        </div>
        
      </div>
      
      {/* Sync notification */}
      <SyncNotification 
        error={syncError} 
        onClose={() => setSyncError(null)}
        topOffset={playerData ? "350px" : "270px"}
      />
    </>
  );
}