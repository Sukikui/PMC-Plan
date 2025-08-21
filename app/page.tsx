'use client';

import { useState } from 'react';
import PlacesPanel from '@/components/PlacesPanel';
import PlayerOverlay from '@/components/PlayerOverlay';

export default function Home() {
  const [selectedPlaceId, setSelectedPlaceId] = useState<string>('');

  const handlePlaceSelect = (id: string, type: 'place' | 'portal') => {
    setSelectedPlaceId(id);
    console.log('Selected:', id, type);
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
      <PlayerOverlay />
    </div>
  );
}