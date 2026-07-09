'use client';

import { useEffect, useState } from 'react';
import DestinationPanel from '@/components/DestinationPanel';
import PositionPanel from '@/components/PositionPanel';
import { useOverlay } from '@/components/overlay/OverlayProvider';
import SettingsPanel from '@/components/SettingsPanel';
import Overlay from '@/components/ui/Overlay';
import GlobalTradeOverlay from '@/components/GlobalTradeOverlay';
import BetaLockScreen from '@/components/BetaLockScreen';
import StartupScreen from '@/components/StartupScreen';
import MainMapBackground from '@/components/map/MainMapBackground';
import { themeColors } from '@/lib/theme-colors';
import { preloadMainScreenResources } from '@/lib/preload/main-screen';
import { NETHER_MAP_WORLD, OVERWORLD_MAP_WORLD, type MapWorld } from '@/lib/map/metadata';
import type { DestinationType } from '@/lib/destination/selection';

import { Place, Portal } from './api/utils/shared';

export default function Home() {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string>('');
  const [selectedPlaceType, setSelectedPlaceType] = useState<DestinationType>('place');
  const [playerPosition, setPlayerPosition] = useState<{x: number; y: number; z: number; world: string} | null>(null);
  const [manualCoords, setManualCoords] = useState<{x: string; y: string; z: string; world: 'overworld' | 'nether'}>({
    x: '', y: '', z: '', world: OVERWORLD_MAP_WORLD
  });
  const { openPlaceInfo } = useOverlay();
  const [isMarketOpen, setIsMarketOpen] = useState(false);
  const [isMarketClosing, setIsMarketClosing] = useState(false);
  const [startupPreloadComplete, setStartupPreloadComplete] = useState(false);
  const [activeMapWorld, setActiveMapWorld] = useState<MapWorld>(OVERWORLD_MAP_WORLD);

  useEffect(() => {
    let cancelled = false;
    const minimumStartupDelay = new Promise((resolve) => setTimeout(resolve, 1000));

    Promise.all([preloadMainScreenResources(), minimumStartupDelay]).finally(() => {
      if (!cancelled) {
        setStartupPreloadComplete(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const openMarket = () => {
    setIsMarketClosing(false);
    setIsMarketOpen(true);
  };
  const closeMarket = () => {
    setIsMarketClosing(true);
    setTimeout(() => {
      setIsMarketOpen(false);
      setIsMarketClosing(false);
    }, 300);
  };

  const handlePlaceSelect = (id: string, type: DestinationType, world?: MapWorld) => {
    if (id && world) {
      setActiveMapWorld(world);
    }

    setSelectedPlaceId(id);
    setSelectedPlaceType(type);
  };

  const handleInfoClick = (item: Place | Portal, type: 'place' | 'portal') => {
    openPlaceInfo(item, type, handlePlaceSelect);
  };

  const toggleNetherMap = () => {
    setActiveMapWorld((world) => (
      world === NETHER_MAP_WORLD ? OVERWORLD_MAP_WORLD : NETHER_MAP_WORLD
    ));
  };

  // Show lock screen if not unlocked and beta lock is not disabled
  const shouldShowLockScreen = process.env.NEXT_PUBLIC_DISABLE_BETA_LOCK !== 'true' && !isUnlocked;
  
  if (shouldShowLockScreen) {
    return <BetaLockScreen onUnlock={() => setIsUnlocked(true)} />;
  }

  // Show startup screen if beta lock is disabled and not unlocked yet
  if (process.env.NEXT_PUBLIC_DISABLE_BETA_LOCK === 'true' && !isUnlocked) {
    return <StartupScreen ready={startupPreloadComplete} onUnlock={() => setIsUnlocked(true)} />;
  }

  return (
    <div className={`relative h-screen overflow-hidden ${themeColors.mainScreen.noDestination} ${themeColors.transition}`}>
      <MainMapBackground
        world={activeMapWorld}
        onSelectItem={handlePlaceSelect}
        selectedId={selectedPlaceId}
        selectedType={selectedPlaceType}
      />

      {/* Left sliding panel */}
      <DestinationPanel
        activeMapWorld={activeMapWorld}
        onPlaceSelect={handlePlaceSelect}
        selectedId={selectedPlaceId}
        selectedType={selectedPlaceType}
        playerPosition={playerPosition}
        manualCoords={manualCoords}
        onInfoClick={handleInfoClick}
      />
      
      {/* Player overlay */}
      <PositionPanel 
        onPlayerPositionChange={setPlayerPosition}
        onManualCoordsChange={setManualCoords}
      />
      
      {/* InfoOverlay is rendered globally by OverlayProvider */}

      {/* settings Panel */}
      <SettingsPanel onOpenMarket={openMarket} onOpenNetherMap={toggleNetherMap} />

      {/* Global Market button is rendered by SettingsPanel (absolute above trigger/panel) */}

      {/* Global Market Overlay */}
      {isMarketOpen && (
        <Overlay isOpen={isMarketOpen} onClose={closeMarket} closing={isMarketClosing}>
          <GlobalTradeOverlay offers={null} onClose={closeMarket} closing={isMarketClosing} onSelectItem={handlePlaceSelect} />
        </Overlay>
      )}

    </div>
  );
}
