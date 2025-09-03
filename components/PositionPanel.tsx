'use client';

import { useState, useEffect, useCallback } from 'react';
import SyncNotification, { getErrorMessage, ERROR_MESSAGES } from './SyncNotification';

interface PlayerData {
  x: number;
  y: number;
  z: number;
  world: string;
  biome: string;
  uuid: string;
  username: string;
}

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
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch('http://localhost:25565/api/coords', {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: PlayerData = await response.json();
      
      // Trigger blue halo effect for new connections
      if (!isConnected && !isAutoSync) {
        setIsNewConnection(true);
        setTimeout(() => setIsNewConnection(false), 500);
      }
      
      setPlayerData(data);
      setIsConnected(true);
    } catch (err) {
      const rawErrorMessage = err instanceof Error ? err.message : 'Unknown error';
      const categorizedErrorMessage = getErrorMessage(rawErrorMessage); // Get the categorized message

      // Only log as "Unexpected sync error" if it's not a known, non-critical error
      if (categorizedErrorMessage !== ERROR_MESSAGES.NOT_IN_WORLD && // Add this condition
          categorizedErrorMessage !== ERROR_MESSAGES.ACCESS_DENIED && // Also exclude access denied from unexpected
          categorizedErrorMessage !== ERROR_MESSAGES.CONNECTION_FAILED && // Also exclude connection failed from unexpected
          !rawErrorMessage.includes('Failed to fetch') && // Keep existing network checks
          !rawErrorMessage.includes('Load failed') &&
          !rawErrorMessage.includes('aborted') &&
          !rawErrorMessage.includes('NetworkError')) {
        console.error('Unexpected sync error:', {
          error: err,
          message: rawErrorMessage,
          type: err instanceof Error ? err.constructor.name : typeof err
        });
      }

      setIsConnected(false);
      setPlayerData(null);

      if (!isAutoSync) {
        setSyncError(categorizedErrorMessage); // Use the categorized message for notification
        
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 500);
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
        <div className="bg-white/90 dark:bg-gray-900/95 backdrop-blur-md shadow-2xl dark:shadow-black/65 rounded-xl border border-gray-200/50 dark:border-gray-800/50 transition-colors duration-300">

      {/* Server Logo */}
      <div className="p-4 flex justify-center bg-white/90 dark:bg-gray-900/95 backdrop-blur-sm rounded-t-xl border-b border-gray-200/30 dark:border-gray-800/50 transition-colors duration-300">
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
      <div className="p-4 border-b border-gray-200/50 dark:border-gray-800/50 bg-white/90 dark:bg-gray-900/95 backdrop-blur-sm transition-colors duration-300">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-blue-500 animate-pulse' : 'bg-red-500'}`}></div>
            <h2 className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide transition-colors duration-300">Position du Client</h2>
          </div>
          
          <button
            onClick={isConnected ? disconnect : () => syncPosition()}
            disabled={isLoading}
            className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-all ${
              isLoading
                ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                : isConnected
                ? 'bg-red-500 text-white hover:bg-red-600 active:scale-95'
                : 'bg-blue-500 text-white hover:bg-blue-600 active:scale-95'
            } ${
              isShaking ? 'animate-pulse' : ''
            }`}
            style={{
              animation: isShaking ? 'shake 0.5s ease-in-out' : undefined
            }}
          >
            {isLoading ? (
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 border border-gray-400 dark:border-gray-300 border-t-transparent rounded-full animate-spin"></div>
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
      <div className="p-4 space-y-3 bg-white/90 dark:bg-gray-900/95 backdrop-blur-sm rounded-b-xl transition-colors duration-300">
        {playerData ? (
          <>
            {/* Player name */}
            <div 
              className="bg-white/90 dark:bg-gray-900/95 backdrop-blur-sm rounded-lg p-3 border border-gray-200/50 dark:border-gray-800/50 transition-colors duration-300"
              style={{
                animation: isNewConnection ? 'blueGlow 0.5s ease-out' : undefined,
                animationName: isNewConnection ? (document.documentElement.classList.contains('dark') ? 'blueGlowDark' : 'blueGlow') : undefined
              }}
            >
              <div className="flex items-center gap-3">
                <img 
                  src={`https://crafatar.com/avatars/${playerData.uuid}?size=64&overlay`}
                  alt={`${playerData.username}'s avatar`}
                  className="w-8 h-8 rounded"
                  style={{ imageRendering: 'pixelated' }}
                  onError={() => {
                    // Keep the default fallback (Alex/Steve)
                  }}
                />
                <div>
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100 transition-colors duration-300">{playerData.username}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 transition-colors duration-300">UUID: {playerData.uuid.substring(0, 8)}...</div>
                </div>
              </div>
            </div>

            {/* World selector */}
            <div className="flex gap-1">
              <button
                className={`px-2 py-1 text-xs rounded-full font-medium transition-colors ${
                  (playerData.world === 'overworld' || playerData.world === 'minecraft:overworld')
                    ? 'bg-green-100 dark:bg-green-800/30 text-green-700 dark:text-green-300 border border-green-100 dark:border-none'
                    : 'bg-white dark:bg-transparent text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600'
                }`}
                disabled
              >
                overworld
              </button>
              <button
                className={`px-2 py-1 text-xs rounded-full font-medium transition-colors ${
                  (playerData.world === 'nether' || playerData.world === 'minecraft:the_nether')
                    ? 'bg-red-100 dark:bg-red-800/30 text-red-700 dark:text-red-300 border border-red-100 dark:border-none'
                    : 'bg-white dark:bg-transparent text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600'
                }`}
                disabled
              >
                nether
              </button>
            </div>

            {/* Coordinates */}
            <div className="flex items-center gap-3">
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300 w-4 text-center transition-colors duration-300">X</label>
              <div className="w-16 px-2 py-1 text-xs text-gray-900 dark:text-gray-100 bg-white/90 dark:bg-gray-900/95 border border-gray-200/50 dark:border-gray-800/50 rounded transition-colors duration-300">
                {Math.floor(playerData.x)}
              </div>
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300 w-4 text-center transition-colors duration-300">Y</label>
              <div className="w-16 px-2 py-1 text-xs text-gray-900 dark:text-gray-100 bg-white/90 dark:bg-gray-900/95 border border-gray-200/50 dark:border-gray-800/50 rounded transition-colors duration-300">
                {Math.floor(playerData.y)}
              </div>
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300 w-4 text-center transition-colors duration-300">Z</label>
              <div className="w-16 px-2 py-1 text-xs text-gray-900 dark:text-gray-100 bg-white/70 dark:bg-gray-900/70 border border-gray-300 dark:border-gray-600 rounded mr-3 transition-colors duration-300">
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
                className={`px-2 py-1 text-xs rounded-full font-medium transition-colors ${
                  manualWorld === 'overworld'
                    ? 'bg-green-100 dark:bg-green-800/30 text-green-700 dark:text-green-300 border border-green-100 dark:border-none'
                    : 'bg-white dark:bg-transparent text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                }`}
              >
                overworld
              </button>
              <button
                onClick={() => setManualWorld('nether')}
                className={`px-2 py-1 text-xs rounded-full font-medium transition-colors ${
                  manualWorld === 'nether'
                    ? 'bg-red-100 dark:bg-red-800/30 text-red-700 dark:text-red-300 border border-red-100 dark:border-none'
                    : 'bg-white dark:bg-transparent text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                }`}
              >
                nether
              </button>
            </div>

            {/* Coordinates input */}
            <div className="flex items-center gap-3">
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300 w-4 text-center transition-colors duration-300">X</label>
              <input
                type="number"
                value={manualCoords.x}
                onChange={(e) => setManualCoords(prev => ({ ...prev, x: e.target.value }))}
                placeholder="0"
                className="w-16 px-2 py-1 text-xs text-gray-900 dark:text-gray-100 bg-white/90 dark:bg-gray-900/95 border border-gray-200/50 dark:border-gray-800/50 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors placeholder-gray-400 dark:placeholder-gray-500 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300 w-4 text-center transition-colors duration-300">Y</label>
              <input
                type="number"
                value={manualCoords.y}
                onChange={(e) => setManualCoords(prev => ({ ...prev, y: e.target.value }))}
                placeholder="64"
                className="w-16 px-2 py-1 text-xs text-gray-900 dark:text-gray-100 bg-white/90 dark:bg-gray-900/95 border border-gray-200/50 dark:border-gray-800/50 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors placeholder-gray-400 dark:placeholder-gray-500 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300 w-4 text-center transition-colors duration-300">Z</label>
              <input
                type="number"
                value={manualCoords.z}
                onChange={(e) => setManualCoords(prev => ({ ...prev, z: e.target.value }))}
                placeholder="0"
                className="w-16 px-2 py-1 text-xs text-gray-900 dark:text-gray-100 bg-white/80 dark:bg-gray-900/80 border border-gray-200/50 dark:border-gray-800/50 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors placeholder-gray-400 dark:placeholder-gray-500 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none mr-3"
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