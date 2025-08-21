'use client';

import { useState, useEffect } from 'react';

interface Place {
  id: string;
  name: string;
  tags: string[];
  world: 'overworld' | 'nether';
  coordinates: { x: number; y: number; z: number };
  description?: string;
}

interface Portal {
  id: string;
  name: string;
  world: 'overworld' | 'nether';
  coordinates: { x: number; y: number; z: number };
  description?: string;
}

interface PlacesPanelProps {
  onPlaceSelect: (id: string, type: 'place' | 'portal') => void;
  selectedId?: string;
}

export default function PlacesPanel({ onPlaceSelect, selectedId }: PlacesPanelProps) {
  const [places, setPlaces] = useState<Place[]>([]);
  const [portals, setPortals] = useState<Portal[]>([]);
  const [enabledTags, setEnabledTags] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Load places and portals
  useEffect(() => {
    const loadData = async () => {
      try {
        const [placesResponse, portalsResponse] = await Promise.all([
          fetch('/api/places'),
          fetch('/api/portals')
        ]);

        if (placesResponse.ok) {
          const placesData = await placesResponse.json();
          setPlaces(placesData);
        }

        if (portalsResponse.ok) {
          const portalsData = await portalsResponse.json();
          setPortals(portalsData);
        }
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Get all available tags from places
  const allTags = Array.from(new Set(places.flatMap(place => place.tags || [])));

  // Filter places by enabled tags and search query
  const filteredPlaces = places.filter(place => {
    // Filter by tags
    const tagMatch = enabledTags.size === 0 || place.tags?.some(tag => enabledTags.has(tag));
    
    // Filter by search query
    const searchMatch = searchQuery === '' || 
      place.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      place.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      place.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return tagMatch && searchMatch;
  });

  // Filter portals by search query
  const filteredPortals = portals.filter(portal => {
    return searchQuery === '' || 
      portal.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      portal.description?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const toggleTag = (tag: string) => {
    const newEnabledTags = new Set(enabledTags);
    if (newEnabledTags.has(tag)) {
      newEnabledTags.delete(tag);
    } else {
      newEnabledTags.add(tag);
    }
    setEnabledTags(newEnabledTags);
  };

  const handlePlaceClick = (id: string, type: 'place' | 'portal') => {
    if (selectedId === id) {
      onPlaceSelect('', type); // Deselect if clicking on the same item
    } else {
      onPlaceSelect(id, type);
    }
  };

  const getWorldBadge = (world: string) => {
    const baseClasses = "inline-block text-xs px-2 py-1 rounded-full font-medium";
    if (world === 'overworld') {
      return `${baseClasses} bg-green-100 text-green-700`;
    } else if (world === 'nether') {
      return `${baseClasses} bg-red-100 text-red-700`;
    }
    return `${baseClasses} bg-gray-100 text-gray-700`;
  };

  return (
    <div className="fixed top-4 left-4 h-[calc(100vh-2rem)] w-96 bg-white/90 backdrop-blur-md shadow-2xl rounded-xl border border-gray-200/50 z-50 flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 p-6 border-b border-gray-200/50 bg-white/80 backdrop-blur-sm rounded-t-xl">
        {/* Tag Filters */}
        <div className="mt-4">
          <div className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Filtrer par tags</div>
          <div className="flex flex-wrap gap-1">
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                  enabledTags.has(tag)
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Search Bar */}
        <div className="mt-4">
          <div className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Rechercher</div>
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Nom, description, tags..."
              className="w-full px-3 py-2 text-sm text-gray-900 bg-white/70 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors placeholder-gray-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Scrollable Content with blur effects */}
      <div className="relative flex-1 min-h-0 rounded-b-xl overflow-hidden">
        {/* Top solid + blur gradient */}
        <div className="absolute top-0 left-0 right-0 h-3 bg-white z-10 pointer-events-none" />
        <div className="absolute top-3 left-0 right-0 h-8 bg-gradient-to-b from-white via-white/90 to-transparent z-10 pointer-events-none" />
        
        {/* Scrollable list */}
        <div 
          className="h-full overflow-y-auto pt-12 pb-16 px-6 [&::-webkit-scrollbar]:hidden" 
          style={{
            scrollbarWidth: 'none', 
            msOverflowStyle: 'none'
          }}
        >
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-500">Chargement...</div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Places Section */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Lieux</h3>
                <div className="space-y-2">
                  {filteredPlaces.map(place => (
                    <div
                      key={place.id}
                      onClick={() => handlePlaceClick(place.id, 'place')}
                      className={`group p-4 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md ${
                        selectedId === place.id 
                          ? 'bg-blue-50 border-2 border-blue-200 shadow-sm' 
                          : 'bg-white/70 border border-gray-200/70 hover:bg-white/90 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-medium text-gray-900 group-hover:text-blue-900">
                        {place.name}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={getWorldBadge(place.world)}>
                          {place.world}
                        </span>
                        <span className="text-xs text-gray-500">
                          {place.coordinates.x}, {place.coordinates.y}, {place.coordinates.z}
                        </span>
                      </div>
                      {selectedId === place.id && place.description && (
                        <div className="mt-2 p-2 bg-blue-50/50 border-l-2 border-blue-300 rounded-r">
                          <p className="text-xs text-gray-700">{place.description}</p>
                        </div>
                      )}
                      {place.tags && place.tags.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {place.tags.map(tag => (
                            <span 
                              key={tag} 
                              className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Portals Section */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Portails</h3>
                <div className="space-y-2">
                  {filteredPortals.map(portal => (
                    <div
                      key={portal.id}
                      onClick={() => handlePlaceClick(portal.id, 'portal')}
                      className={`group p-4 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md ${
                        selectedId === portal.id 
                          ? 'bg-purple-50 border-2 border-purple-200 shadow-sm' 
                          : 'bg-white/70 border border-gray-200/70 hover:bg-white/90 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-medium text-gray-900 group-hover:text-purple-900">
                        {portal.name}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={getWorldBadge(portal.world)}>
                          {portal.world}
                        </span>
                        <span className="text-xs text-gray-500">
                          {portal.coordinates.x}, {portal.coordinates.y}, {portal.coordinates.z}
                        </span>
                      </div>
                      {selectedId === portal.id && portal.description && (
                        <div className="mt-2 p-2 bg-purple-50/50 border-l-2 border-purple-300 rounded-r">
                          <p className="text-xs text-gray-700">{portal.description}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Bottom solid + blur gradient */}
        <div className="absolute bottom-0 left-0 right-0 h-3 bg-white z-10 pointer-events-none" />
        <div className="absolute bottom-3 left-0 right-0 h-10 bg-gradient-to-t from-white via-white/90 to-transparent z-10 pointer-events-none" />
      </div>
    </div>
  );
}