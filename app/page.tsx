'use client';

import { useState } from 'react';
import DestinationPanel from '@/components/DestinationPanel';
import PositionPanel from '@/components/PositionPanel';
import TravelPlan from '@/components/TravelPlan';
import { useOverlay } from '@/components/overlay/OverlayProvider';
import SettingsPanel from '@/components/SettingsPanel';
import Overlay from '@/components/ui/Overlay';
import GlobalTradeOverlay from '@/components/GlobalTradeOverlay';
import BetaLockScreen from '@/components/BetaLockScreen';
import StartupScreen from '@/components/StartupScreen';
import { themeColors } from '@/lib/theme-colors';

import { Place, Portal } from './api/utils/shared';

export default function Home() {
  
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string>('');
  const [selectedPlaceType, setSelectedPlaceType] = useState<'place' | 'portal'>('place');
  const [playerPosition, setPlayerPosition] = useState<{x: number; y: number; z: number; world: string} | null>(null);
  const [manualCoords, setManualCoords] = useState<{x: string; y: string; z: string; world: 'overworld' | 'nether'}>({
    x: '', y: '', z: '', world: 'overworld'
  });
  const { openPlaceInfo } = useOverlay();
  const [isMarketOpen, setIsMarketOpen] = useState(false);
  const [isMarketClosing, setIsMarketClosing] = useState(false);

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

  const handlePlaceSelect = (id: string, type: 'place' | 'portal') => {
    setSelectedPlaceId(id);
    setSelectedPlaceType(type);
  };

  const handleInfoClick = (item: Place | Portal, type: 'place' | 'portal') => {
    openPlaceInfo(item, type, handlePlaceSelect);
  };

  

  // Show lock screen if not unlocked and beta lock is not disabled
  const shouldShowLockScreen = process.env.NEXT_PUBLIC_DISABLE_BETA_LOCK !== 'true' && !isUnlocked;
  
  if (shouldShowLockScreen) {
    return <BetaLockScreen onUnlock={() => setIsUnlocked(true)} />;
  }

  // Show startup screen if beta lock is disabled and not unlocked yet
  if (process.env.NEXT_PUBLIC_DISABLE_BETA_LOCK === 'true' && !isUnlocked) {
    return <StartupScreen onUnlock={() => setIsUnlocked(true)} />;
  }

  return (
    <div className={`h-screen ${
      selectedPlaceId && (playerPosition || (manualCoords?.x && manualCoords?.y && manualCoords?.z))
        ? themeColors.mainScreen.routeActive  // State 3: Route displayed
        : selectedPlaceId
        ? themeColors.mainScreen.noPosition   // State 2: Destination but no position
        : themeColors.mainScreen.noDestination // State 1: No destination
    } ${themeColors.transition}`}>

      {/* Left sliding panel */}
      <DestinationPanel
        onPlaceSelect={handlePlaceSelect}
        selectedId={selectedPlaceId}
        onInfoClick={handleInfoClick}
      />
      
      {/* Player overlay */}
      <PositionPanel 
        onPlayerPositionChange={setPlayerPosition}
        onManualCoordsChange={setManualCoords}
      />
      
      {/* Travel plan */}
      <TravelPlan 
        selectedPlaceId={selectedPlaceId}
        selectedPlaceType={selectedPlaceType}
        playerPosition={playerPosition}
        manualCoords={manualCoords}
      />
      
      {/* InfoOverlay is rendered globally by OverlayProvider */}

      {/* settings Panel */}
      <SettingsPanel onOpenMarket={openMarket} />

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
