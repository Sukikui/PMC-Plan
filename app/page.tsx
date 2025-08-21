'use client';

import { useState } from 'react';
import PlacesPanel from '@/components/PlacesPanel';
import PlayerOverlay from '@/components/PlayerOverlay';
import TravelPlan from '@/components/TravelPlan';

export default function Home() {
  const [selectedPlaceId, setSelectedPlaceId] = useState<string>('');
  const [selectedPlaceType, setSelectedPlaceType] = useState<'place' | 'portal'>('place');
  const [playerPosition, setPlayerPosition] = useState<{x: number; y: number; z: number; world: string} | null>(null);
  const [manualCoords, setManualCoords] = useState<{x: string; y: string; z: string; world: 'overworld' | 'nether'}>({
    x: '', y: '', z: '', world: 'overworld'
  });

  const handlePlaceSelect = (id: string, type: 'place' | 'portal') => {
    setSelectedPlaceId(id);
    setSelectedPlaceType(type);
  };

  return (
    <div className="h-screen bg-white">
      {/* Simple background for now */}
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-800 text-center">
          <h1 className="text-4xl font-bold mb-4">Carte PMC</h1>
          <p className="text-gray-600">Sélectionnez un lieu dans le panneau de gauche</p>
        </div>
      </div>
      
      {/* Left sliding panel */}
      <PlacesPanel
        onPlaceSelect={handlePlaceSelect}
        selectedId={selectedPlaceId}
      />
      
      {/* Player overlay */}
      <PlayerOverlay 
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
    </div>
  );
}