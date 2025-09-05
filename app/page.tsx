'use client';

import { useState } from 'react';
import DestinationPanel from '@/components/DestinationPanel';
import PositionPanel from '@/components/PositionPanel';
import TravelPlan from '@/components/TravelPlan';
import InfoOverlay from '@/components/InfoOverlay';
import SettingsPanel from '@/components/SettingsPanel';
import BetaLockScreen from '@/components/BetaLockScreen';
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
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [overlayItem, setOverlayItem] = useState<Place | Portal | null>(null);
  const [overlayType, setOverlayType] = useState<'place' | 'portal'>('place');

  const handlePlaceSelect = (id: string, type: 'place' | 'portal') => {
    setSelectedPlaceId(id);
    setSelectedPlaceType(type);
  };

  const handleInfoClick = (item: Place | Portal, type: 'place' | 'portal') => {
    setOverlayItem(item);
    setOverlayType(type);
    setOverlayOpen(true);
  };

  // Show lock screen if not unlocked and beta lock is not disabled
  const shouldShowLockScreen = process.env.NEXT_PUBLIC_DISABLE_BETA_LOCK !== 'true' && !isUnlocked;
  
  if (shouldShowLockScreen) {
    return <BetaLockScreen onUnlock={() => setIsUnlocked(true)} />;
  }

  return (
    <div className={`h-screen ${
      selectedPlaceId && (playerPosition || (manualCoords?.x && manualCoords?.y && manualCoords?.z))
        ? themeColors.mainScreen.routeActive  // État 3: Itinéraire affiché
        : selectedPlaceId
        ? themeColors.mainScreen.noPosition   // État 2: Destination mais pas de position
        : themeColors.mainScreen.noDestination // État 1: Aucune destination
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
      
      {/* Info Overlay */}
      <InfoOverlay
        isOpen={overlayOpen}
        onClose={() => setOverlayOpen(false)}
        item={overlayItem}
        type={overlayType}
      />

      {/* Settings Panel */}
      <SettingsPanel />
    </div>
  );
}