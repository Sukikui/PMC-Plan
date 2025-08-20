'use client';

import { useState, useEffect } from 'react';

interface Place {
  id: string;
  name: string;
  tags: string[];
  dimension: 'overworld' | 'nether' | 'end';
  coordinates: { x: number; y: number; z: number };
  description?: string;
}

interface PlayerPosition {
  dim: 'overworld' | 'nether' | 'end';
  x: number;
  y: number;
  z: number;
  ts: number;
}

interface ControlsProps {
  onDestinationChange: (destination: string) => void;
  onCalculateRoute: (toId: string) => void;
  playerPos: PlayerPosition | null;
}

export default function Controls({ onDestinationChange, onCalculateRoute, playerPos }: ControlsProps) {
  const [places, setPlaces] = useState<Place[]>([]);
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [selectedDestination, setSelectedDestination] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // Load places on component mount
  useEffect(() => {
    const loadPlaces = async () => {
      try {
        const response = await fetch('/api/places');
        if (response.ok) {
          const data = await response.json();
          setPlaces(data);
        }
      } catch (error) {
        console.error('Failed to load places:', error);
      }
    };

    loadPlaces();
  }, []);

  // Get unique tags from all places
  const availableTags = Array.from(new Set(places.flatMap(place => place.tags)));

  // Filter places by selected tag
  const filteredPlaces = selectedTag 
    ? places.filter(place => place.tags.includes(selectedTag))
    : places;

  const handleTagChange = (tag: string) => {
    setSelectedTag(tag);
    setSelectedDestination('');
    onDestinationChange('');
  };

  const handleDestinationChange = (placeId: string) => {
    setSelectedDestination(placeId);
    onDestinationChange(placeId);
  };

  const handleCalculateRoute = async () => {
    if (!selectedDestination || !playerPos) return;

    setLoading(true);
    try {
      await onCalculateRoute(selectedDestination);
    } finally {
      setLoading(false);
    }
  };

  const selectedPlace = places.find(place => place.id === selectedDestination);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold mb-4">PMC Map Navigator</h2>
        
        {!playerPos && (
          <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4">
            <p className="text-sm">
              Start your Minecraft client with the position mod to see your current location.
            </p>
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Filter by Tag
        </label>
        <select 
          value={selectedTag} 
          onChange={(e) => handleTagChange(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">All Places</option>
          {availableTags.map(tag => (
            <option key={tag} value={tag}>{tag}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Destination
        </label>
        <select 
          value={selectedDestination} 
          onChange={(e) => handleDestinationChange(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Select a destination...</option>
          {filteredPlaces.map(place => (
            <option key={place.id} value={place.id}>
              {place.name} ({place.dimension})
            </option>
          ))}
        </select>
      </div>

      {selectedPlace && (
        <div className="bg-gray-50 p-4 rounded-md">
          <h3 className="font-medium text-gray-900">{selectedPlace.name}</h3>
          <p className="text-sm text-gray-600 mt-1">
            {selectedPlace.dimension} ({selectedPlace.coordinates.x}, {selectedPlace.coordinates.y}, {selectedPlace.coordinates.z})
          </p>
          {selectedPlace.description && (
            <p className="text-sm text-gray-600 mt-2">{selectedPlace.description}</p>
          )}
          <div className="mt-2">
            {selectedPlace.tags.map(tag => (
              <span key={tag} className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mr-1">
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={handleCalculateRoute}
        disabled={!selectedDestination || !playerPos || loading}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
      >
        {loading ? 'Calculating...' : 'Calculate Route'}
      </button>

      {playerPos && (
        <div className="mt-6 p-4 bg-green-50 rounded-md">
          <h3 className="font-medium text-green-900 mb-2">Current Position</h3>
          <div className="text-sm text-green-800">
            <div>Dimension: {playerPos.dim}</div>
            <div>Coordinates: {playerPos.x.toFixed(0)}, {playerPos.y.toFixed(0)}, {playerPos.z.toFixed(0)}</div>
            <div className="text-xs text-green-600 mt-1">
              Updated: {new Date(playerPos.ts * 1000).toLocaleTimeString()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}