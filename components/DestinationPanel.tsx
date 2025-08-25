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
  'nether-associate'?: {
    id: string;
    coordinates: { x: number; y: number; z: number };
    address: string;
  };
}

interface DestinationPanelProps {
  onPlaceSelect: (id: string, type: 'place' | 'portal') => void;
  selectedId?: string;
  onInfoClick: (item: Place | Portal, type: 'place' | 'portal') => void;
}

export default function DestinationPanel({ onPlaceSelect, selectedId, onInfoClick }: DestinationPanelProps) {
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
          fetch('/api/portals?merge-nether-portals=true')
        ]);

        // Handle places response
        if (placesResponse.ok) {
          const placesData = await placesResponse.json();
          setPlaces(placesData);
        } else {
          const placesError = await placesResponse.json().catch(() => ({}));
          console.error('Places API error:', placesError);
        }

        // Handle portals response
        if (portalsResponse.ok) {
          const portalsData = await portalsResponse.json();
          setPortals(portalsData);
        } else {
          const portalsError = await portalsResponse.json().catch(() => ({}));
          console.error('Portals API error:', portalsError);
        }
      } catch (error) {
        console.error('Network error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Get all available tags from places
  const allTags = Array.from(new Set(places.flatMap(place => place.tags || [])));

  const associatedPortalIds = new Set(portals.map(p => p['nether-associate']?.id).filter(Boolean));

  // Filter places by enabled tags and search query
  const filteredPlaces = places.filter(place => {
    // Filter by tags
    const tagMatch = enabledTags.size === 0 || place.tags?.some(tag => enabledTags.has(tag));
    
    // Filter by search query
    const searchMatch = searchQuery === '' || 
      place.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      place.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      place.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
      place.world.toLowerCase().includes(searchQuery.toLowerCase());
    
    return tagMatch && searchMatch;
  });

  // Filter portals by search query
  const filteredPortals = portals.filter(portal => {
    if (associatedPortalIds.has(portal.id)) {
        return false;
    }
    return searchQuery === '' || 
      portal.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      portal.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      portal.world.toLowerCase().includes(searchQuery.toLowerCase());
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

  const handleInfoClick = (e: React.MouseEvent, item: Place | Portal, type: 'place' | 'portal') => {
    e.stopPropagation();
    onInfoClick(item, type);
  };

  const getWorldBadge = (world: string) => {
    const baseClasses = "inline-block text-xs px-2 py-1 rounded-full font-medium transition-colors duration-300";
    if (world === 'overworld') {
      return `${baseClasses} bg-green-100 dark:bg-green-800/30 text-green-700 dark:text-green-300`;
    } else if (world === 'nether') {
      return `${baseClasses} bg-red-100 dark:bg-red-800/30 text-red-700 dark:text-red-300`;
    }
    return `${baseClasses} bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300`;
  };

  return (
    <div className="fixed top-4 left-4 h-[calc(100vh-2rem)] w-96 bg-white/90 dark:bg-gray-900/95 backdrop-blur-md shadow-2xl rounded-xl border border-gray-200/50 dark:border-gray-600/50 z-50 flex flex-col transition-colors duration-300">
      {/* Header */}
      <div className="flex-shrink-0 p-6 border-b border-gray-200/50 dark:border-gray-600/50 bg-white/90 dark:bg-gray-900/95 backdrop-blur-sm rounded-t-xl transition-colors duration-300">
        {/* Tag Filters */}
        <div className="mt-2">
          <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wide transition-colors duration-300">Filtrer par tags</div>
          <div className="flex flex-wrap gap-1">
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`px-2 py-1 text-xs rounded-full border transition-colors duration-300 ${
                  enabledTags.has(tag)
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'bg-white dark:bg-transparent text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Search Bar */}
        <div className="mt-6">
          <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wide transition-colors duration-300">Rechercher</div>
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Nom, description, tags, monde..."
              className="w-full px-3 py-2 text-sm text-gray-900 dark:text-gray-100 bg-white/70 dark:bg-gray-900/70 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-300 placeholder-gray-400 dark:placeholder-gray-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-300"
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
        <div className="absolute top-0 left-0 right-0 h-3 bg-white/90 dark:bg-gray-900/95 z-10 pointer-events-none transition-colors duration-300" />
        <div className="absolute top-3 left-0 right-0 h-8 bg-gradient-to-b from-white/90 dark:from-gray-900/95 via-white/80 dark:via-gray-900/80 to-transparent z-10 pointer-events-none transition-colors duration-300" />
        
        {/* Scrollable list */}
        <div 
          className="h-full overflow-y-auto pt-9 pb-16 px-6 [&::-webkit-scrollbar]:hidden bg-white/90 dark:bg-gray-900/95 transition-colors duration-300" 
          style={{
            scrollbarWidth: 'none', 
            msOverflowStyle: 'none'
          }}
        >
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-500 dark:text-gray-400 transition-colors duration-300">Chargement...</div>
            </div>
          ) : (
            (filteredPlaces.length === 0 && filteredPortals.length === 0) ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500 text-center space-y-4">
                <p>Aucun résultats (｡•́︿•̀｡)</p>
                <a href="https://github.com/Sukikui/PMC-Plan/issues" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-plus-circle" viewBox="0 0 16 16">
                    <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/>
                    <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4"/>
                  </svg>
                  Ajouter un lieu ou un portail
                </a>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Places Section */}
                {filteredPlaces.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-3 uppercase tracking-wide transition-colors duration-300">Lieux</h3>
                    <div className="space-y-2">
                      {filteredPlaces.map(place => (
                        <div
                          key={place.id}
                          onClick={() => handlePlaceClick(place.id, 'place')}
                          className={`relative group p-4 rounded-lg cursor-pointer transition-all duration-300 hover:shadow-md ${
                            selectedId === place.id 
                              ? 'bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-700 shadow-sm' 
                              : 'bg-white/70 dark:bg-gray-900/70 border border-gray-200/70 dark:border-gray-600/70 hover:bg-white/90 dark:hover:bg-gray-900/90 hover:border-gray-300 dark:hover:border-gray-500'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="font-medium text-gray-900 dark:text-gray-100 group-hover:text-blue-900 dark:group-hover:text-blue-300 flex-1 transition-colors duration-300">
                              {place.name}
                            </div>
                            <button
                              onClick={(e) => handleInfoClick(e, place, 'place')}
                              className="ml-2 p-1 rounded-full bg-white dark:bg-gray-900 hover:bg-white/90 dark:hover:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-500 border border-gray-200 dark:border-gray-600 shadow-sm transition-all duration-300 flex-shrink-0"
                              aria-label="Plus d'informations"
                            >
                              <span className="w-4 h-4 flex items-center justify-center text-gray-400 dark:text-gray-300 text-sm transition-colors duration-300">
                                +
                              </span>
                            </button>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={getWorldBadge(place.world)}>
                              {place.world}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400 transition-colors duration-300">
                              {place.coordinates.x}, {place.coordinates.y}, {place.coordinates.z}
                            </span>
                          </div>
                          {selectedId === place.id && place.description && (
                            <div className="mt-2 p-2 bg-blue-50/50 border-l-2 border-blue-300 rounded-r">
                              <p className="text-xs text-gray-700">
                                {place.description.length > 80 ? `${place.description.substring(0, 80)}...` : place.description}
                              </p>
                            </div>
                          )}
                          {place.tags && place.tags.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {place.tags.map(tag => (
                                <span 
                                  key={tag} 
                                  className="inline-block bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs px-2 py-1 rounded-full transition-colors duration-300"
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
                )}

                {/* Portals Section */}
                {filteredPortals.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-3 uppercase tracking-wide transition-colors duration-300">Portails</h3>
                    <div className="space-y-2">
                      {filteredPortals.map(portal => (
                        <div
                          key={portal.id}
                          onClick={() => handlePlaceClick(portal.id, 'portal')}
                          className={`relative group p-4 rounded-lg cursor-pointer transition-all duration-300 hover:shadow-md ${
                            selectedId === portal.id 
                              ? 'bg-purple-50 dark:bg-purple-900/20 border-2 border-purple-200 dark:border-purple-700 shadow-sm' 
                              : 'bg-white/70 dark:bg-gray-900/70 border border-gray-200/70 dark:border-gray-600/70 hover:bg-white/90 dark:hover:bg-gray-900/90 hover:border-gray-300 dark:hover:border-gray-500'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="font-medium text-gray-900 dark:text-gray-100 group-hover:text-purple-900 dark:group-hover:text-purple-300 flex-1 transition-colors duration-300">
                              {portal.name}
                            </div>
                            <button
                              onClick={(e) => handleInfoClick(e, portal, 'portal')}
                              className="ml-2 p-1 rounded-full bg-white dark:bg-gray-900 hover:bg-white/90 dark:hover:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-500 border border-gray-200 dark:border-gray-600 shadow-sm transition-all duration-300 flex-shrink-0"
                              aria-label="Plus d'informations"
                            >
                              <span className="w-4 h-4 flex items-center justify-center text-gray-400 dark:text-gray-300 text-sm transition-colors duration-300">
                                +
                              </span>
                            </button>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={getWorldBadge(portal.world)}>
                              {portal.world}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400 transition-colors duration-300">
                              {portal.coordinates.x}, {portal.coordinates.y}, {portal.coordinates.z}
                            </span>
                          </div>
                          {portal['nether-associate'] && (
                            <div className="mt-2 pt-2 border-t border-gray-200/80 dark:border-gray-700/80 transition-colors duration-300">
                                <div className="flex items-center gap-2">
                                    <span className={getWorldBadge('nether')}>
                                    nether
                                    </span>
                                    <div className="flex items-center justify-between w-full">
                                        <span className="text-xs text-gray-500 dark:text-gray-400 transition-colors duration-300">
                                            {portal['nether-associate'].coordinates.x}, {portal['nether-associate'].coordinates.y}, {portal['nether-associate'].coordinates.z}
                                        </span>
                                        <span className="text-xs text-gray-500 dark:text-gray-400 transition-colors duration-300">
                                            {portal['nether-associate'].address}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            )}
                          {selectedId === portal.id && portal.description && (
                            <div className="mt-2 p-2 bg-purple-50/50 border-l-2 border-purple-300 rounded-r">
                              <p className="text-xs text-gray-700">
                                {portal.description.length > 80 ? `${portal.description.substring(0, 80)}...` : portal.description}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          )}
        </div>
        
        {/* Bottom solid + blur gradient */}
        <div className="absolute bottom-0 left-0 right-0 h-2 bg-white dark:bg-gray-900 z-10 pointer-events-none transition-colors duration-300" />
        <div className="absolute bottom-2 left-0 right-0 h-8 bg-gradient-to-t from-white dark:from-gray-900 via-white/90 dark:via-gray-900/90 to-transparent z-10 pointer-events-none transition-colors duration-300" />
      </div>
    </div>
  );
}