'use client';

import { useState, useEffect } from 'react';

interface PlayerData {
  x: number;
  y: number;
  z: number;
  world: string;
  biome: string;
  uuid: string;
  username: string;
}

export default function PlayerOverlay() {
  const [playerData, setPlayerData] = useState<PlayerData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [manualCoords, setManualCoords] = useState({ x: '', y: '', z: '' });
  const [manualWorld, setManualWorld] = useState<'overworld' | 'nether'>('overworld');
  const [isShaking, setIsShaking] = useState(false);
  const [isErrorFading, setIsErrorFading] = useState(false);

  const syncPosition = async (isAutoSync = false) => {
    if (!isAutoSync) {
      setIsLoading(true);
    }
    setError(null);

    try {
      const response = await fetch('http://localhost:25565/api/coords');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: PlayerData = await response.json();
      setPlayerData(data);
      setIsConnected(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      
      if (errorMessage.includes('404')) {
        setError('Joueur pas dans un monde');
      } else if (errorMessage.includes('403')) {
        setError('Accès refusé par le mod');
      } else {
        setError('Impossible de se connecter au mod');
      }
      
      setIsConnected(false);
      if (!isAutoSync) {
        setIsShaking(true);
        setIsErrorFading(false);
        setTimeout(() => setIsShaking(false), 500);
        setTimeout(() => {
          setIsErrorFading(true);
          setTimeout(() => setError(null), 300);
        }, 4500);
      }
      console.error('Failed to sync position:', err);
    } finally {
      if (!isAutoSync) {
        setIsLoading(false);
      }
    }
  };

  const disconnect = () => {
    setIsConnected(false);
    setPlayerData(null);
    setError(null);
  };

  // Auto-sync every 2 seconds when connected
  useEffect(() => {
    if (!isConnected) return;

    const interval = setInterval(() => syncPosition(true), 2000);
    return () => clearInterval(interval);
  }, [isConnected]);


  return (
    <>
      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
          20%, 40%, 60%, 80% { transform: translateX(2px); }
        }
      `}</style>
      <div className="fixed top-4 right-4 w-80 z-50">
        <div className="bg-white/90 backdrop-blur-md shadow-2xl rounded-xl border border-gray-200/50">
      {/* Header with sync button */}
      <div className="p-4 border-b border-gray-200/50 bg-white/80 backdrop-blur-sm rounded-t-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <h2 className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Position du Client</h2>
          </div>
          
          <button
            onClick={isConnected ? disconnect : () => syncPosition()}
            disabled={isLoading}
            className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-all ${
              isLoading
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                : isConnected
                ? 'bg-red-500 text-white hover:bg-red-600 active:scale-95'
                : 'bg-blue-500 text-white hover:bg-blue-600 active:scale-95'
            } ${isShaking ? 'animate-pulse' : ''}`}
            style={{
              animation: isShaking ? 'shake 0.5s ease-in-out' : undefined
            }}
          >
            {isLoading ? (
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin"></div>
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
      <div className="p-4 space-y-3">
        {playerData ? (
          <>
            {/* Player name */}
            <div className="bg-white/70 rounded-lg p-3 border border-gray-200/70">
              <div className="flex items-center gap-3">
                <img 
                  src={`https://crafatar.com/avatars/${playerData.uuid.replace(/-/g, '')}?size=64&overlay`}
                  alt={`${playerData.username}'s avatar`}
                  className="w-8 h-8 rounded"
                  style={{ imageRendering: 'pixelated' }}
                  onError={() => {
                    // Keep the default fallback (Alex/Steve)
                  }}
                />
                <div>
                  <div className="text-sm font-medium text-gray-900">{playerData.username}</div>
                  <div className="text-xs text-gray-500 mt-0.5">UUID: {playerData.uuid.substring(0, 8)}...</div>
                </div>
              </div>
            </div>

            {/* World selector */}
            <div className="flex gap-1">
              <button
                className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                  (playerData.world === 'overworld' || playerData.world === 'minecraft:overworld')
                    ? 'bg-green-100 text-green-700 border-green-100'
                    : 'bg-white text-gray-600 border-gray-300'
                }`}
                disabled
              >
                overworld
              </button>
              <button
                className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                  (playerData.world === 'nether' || playerData.world === 'minecraft:the_nether')
                    ? 'bg-red-100 text-red-700 border-red-100'
                    : 'bg-white text-gray-600 border-gray-300'
                }`}
                disabled
              >
                nether
              </button>
            </div>

            {/* Coordinates */}
            <div className="flex items-center gap-3">
              <label className="text-xs font-medium text-gray-700 w-4 text-center">X</label>
              <div className="w-16 px-2 py-1 text-xs text-gray-900 bg-white/70 border border-gray-300 rounded">
                {playerData.x.toFixed(1)}
              </div>
              <label className="text-xs font-medium text-gray-700 w-4 text-center">Y</label>
              <div className="w-16 px-2 py-1 text-xs text-gray-900 bg-white/70 border border-gray-300 rounded">
                {playerData.y.toFixed(1)}
              </div>
              <label className="text-xs font-medium text-gray-700 w-4 text-center">Z</label>
              <div className="w-16 px-2 py-1 text-xs text-gray-900 bg-white/70 border border-gray-300 rounded mr-3">
                {playerData.z.toFixed(1)}
              </div>
            </div>
          </>
        ) : (
          <div className="space-y-4">
            {/* World selector */}
            <div className="flex gap-1">
              <button
                onClick={() => setManualWorld('overworld')}
                className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                  manualWorld === 'overworld'
                    ? 'bg-green-100 text-green-700 border-green-100'
                    : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                }`}
              >
                overworld
              </button>
              <button
                onClick={() => setManualWorld('nether')}
                className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                  manualWorld === 'nether'
                    ? 'bg-red-100 text-red-700 border-red-100'
                    : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                }`}
              >
                nether
              </button>
            </div>

            {/* Coordinates input */}
            <div className="flex items-center gap-3">
              <label className="text-xs font-medium text-gray-700 w-4 text-center">X</label>
              <input
                type="number"
                value={manualCoords.x}
                onChange={(e) => setManualCoords(prev => ({ ...prev, x: e.target.value }))}
                placeholder="0"
                className="w-16 px-2 py-1 text-xs text-gray-900 bg-white/70 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors placeholder-gray-400 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <label className="text-xs font-medium text-gray-700 w-4 text-center">Y</label>
              <input
                type="number"
                value={manualCoords.y}
                onChange={(e) => setManualCoords(prev => ({ ...prev, y: e.target.value }))}
                placeholder="64"
                className="w-16 px-2 py-1 text-xs text-gray-900 bg-white/70 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors placeholder-gray-400 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <label className="text-xs font-medium text-gray-700 w-4 text-center">Z</label>
              <input
                type="number"
                value={manualCoords.z}
                onChange={(e) => setManualCoords(prev => ({ ...prev, z: e.target.value }))}
                placeholder="0"
                className="w-16 px-2 py-1 text-xs text-gray-900 bg-white/70 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors placeholder-gray-400 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none mr-3"
              />
            </div>
          </div>
        )}
      </div>
        </div>
        
      </div>
      
      {/* Error notification as separate fixed element */}
      {error && (
        <div 
          className={`fixed right-4 w-80 bg-red-50 border border-red-200 rounded-lg p-3 z-[9999] transition-opacity duration-300 ${
            isErrorFading ? 'opacity-0' : 'opacity-100'
          }`}
          style={{ 
            top: playerData ? '270px' : '190px',
            boxShadow: 'none'
          }}
        >
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <p className="text-xs text-red-700 font-medium">{error}</p>
          </div>
          <p className="text-xs text-red-600 mt-1 mb-2">
            {error === 'Joueur pas dans un monde' 
              ? 'Rejoignez un monde Minecraft pour synchroniser'
              : error === 'Accès refusé par le mod'
              ? 'Vérifiez les paramètres du mod PlayerCoordsAPI'
              : 'Assurez-vous que le mod PlayerCoordsAPI est activé'
            }
          </p>
          <button
            onClick={() => window.open('https://modrinth.com/mod/playercoordsapi', '_blank')}
            className="w-full px-3 py-2 text-xs bg-white/80 hover:bg-white border border-red-300 hover:border-red-400 text-red-700 hover:text-red-800 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-1.5 shadow-sm hover:shadow-md backdrop-blur-sm"
          >
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            Télécharger le mod
          </button>
        </div>
      )}
    </>
  );
}