'use client';

import { useState, useEffect } from 'react';
import Map2D from '@/components/Map2D';
import Controls from '@/components/Controls';

interface PlayerPosition {
  dim: 'overworld' | 'nether' | 'end';
  x: number;
  y: number;
  z: number;
  ts: number;
}

export default function Home() {
  const [playerPos, setPlayerPos] = useState<PlayerPosition | null>(null);
  const [destination, setDestination] = useState<string>('');
  const [pathData, setPathData] = useState<any>(null);

  // Poll localhost for player position
  useEffect(() => {
    const pollPosition = async () => {
      try {
        const response = await fetch('http://127.0.0.1:31337/position');
        if (response.ok) {
          const data = await response.json();
          setPlayerPos(data);
        }
      } catch (error) {
        // Silently fail if localhost server is not running
      }
    };

    const interval = setInterval(pollPosition, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleRouteCalculation = async (toId: string) => {
    if (!playerPos) return;

    try {
      const response = await fetch(
        `/api/route?fromDim=${playerPos.dim}&fromX=${playerPos.x}&fromY=${playerPos.y}&fromZ=${playerPos.z}&toId=${toId}`
      );
      if (response.ok) {
        const route = await response.json();
        setPathData(route);
      }
    } catch (error) {
      console.error('Failed to calculate route:', error);
    }
  };

  return (
    <div className="flex h-screen">
      <div className="flex-1">
        <Map2D playerPos={playerPos} pathData={pathData} />
      </div>
      <div className="w-80 bg-gray-100 p-4">
        <Controls 
          onDestinationChange={setDestination}
          onCalculateRoute={handleRouteCalculation}
          playerPos={playerPos}
        />
      </div>
    </div>
  );
}