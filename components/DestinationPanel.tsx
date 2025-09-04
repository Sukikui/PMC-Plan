'use client';

import { useState, useEffect } from 'react';
import ClearIcon from './icons/ClearIcon';
import PlusIcon from './icons/PlusIcon';

import { Portal, Place } from '../app/api/utils/shared';
import { getWorldBadge } from '../lib/ui-utils';

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
  const [tagFilterLogic, setTagFilterLogic] = useState<'OR' | 'AND'>('OR');
  

  const toggleTagFilterLogic = () => {
    setTagFilterLogic(prev => prev === 'OR' ? 'AND' : 'OR');
  };

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
  const allTags = Array.from(new Set(places.flatMap(place => place.tags)));

  // Filter places by enabled tags and search query
  const filteredPlaces = places.filter(place => {
    // Filter by tags
    const tagMatch = enabledTags.size === 0 || (
      tagFilterLogic === 'OR'
        ? place.tags.some(tag => enabledTags.has(tag))
        : Array.from(enabledTags).every(enabledTag => place.tags.includes(enabledTag))
    );

    // Filter by search query
    const searchMatch = searchQuery === '' || 
      place.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      place.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      place.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
      place.world.toLowerCase().includes(searchQuery.toLowerCase());

    return tagMatch && searchMatch;
  });

  // Filter portals by search query
  const filteredPortals = portals.filter(portal => {
    return searchQuery === '' || 
      portal.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      portal.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
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


  return (
    <div className="fixed top-4 left-4 h-[calc(100vh-2rem)] w-96 bg-white/90 dark:bg-gray-900/95 backdrop-blur-md shadow-2xl dark:shadow-black/65 rounded-xl border border-gray-200/50 dark:border-gray-800/50 z-50 flex flex-col transition-colors duration-300">
      {/* Header */}
      <div className="flex-shrink-0 p-6 border-b border-gray-200/50 dark:border-gray-800/50 bg-white/90 dark:bg-gray-900/95 backdrop-blur-sm rounded-t-xl transition-colors duration-300">
        {/* Tag Filters */}
        <div className="mt-2">
          <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wide transition-colors duration-300">Filtrer par tags</div>
          <div className="flex flex-wrap gap-1">
            <button
              onClick={toggleTagFilterLogic}
              className="w-10 py-1 px-2 rounded-full border transition-colors duration-300 font-semibold flex items-center justify-center
                bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-700"
            >
              {tagFilterLogic === 'OR' ? (
                <svg className="w-4 h-4" viewBox="-2 0 28 24" fill="none" stroke="currentColor" strokeWidth="2" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="5" cy="12" r="6" />
                  <circle cx="19" cy="12" r="6" />
                </svg>
              ) : (
                <svg className="w-4 h-4" viewBox="-2 0 28 24" fill="none" stroke="currentColor" strokeWidth="2" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="8" cy="12" r="6" />
                  <circle cx="16" cy="12" r="6" />
                </svg>
              )}
            </button>
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`px-2 py-1 text-xs rounded-full border transition-colors duration-300 ${
                  enabledTags.has(tag)
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'bg-white dark:bg-transparent text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600'
                }`}
              >
                {tag}
              </button>
            ))}
            {enabledTags.size > 0 && (
              <button
                onClick={() => setEnabledTags(new Set())}
                className="flex items-center justify-center text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-300"
                aria-label="Effacer les tags"
              >
                <ClearIcon className="w-4 h-4" />
              </button>
            )}
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
              className="w-full px-3 py-2 text-sm text-gray-900 dark:text-gray-100 bg-white/70 dark:bg-gray-900/70 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-300 placeholder-gray-400 dark:placeholder-gray-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-300"
              >
                <ClearIcon className="w-4 h-4" />
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
                <p>Aucun résultat. (｡•́︿•̀｡)</p>
                <a href="https://github.com/Sukikui/PMC-Plan/issues/new/choose" target="_blank" rel="noopener noreferrer" className="text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 hover:bg-gray-100 dark:hover:bg-gray-800 pl-3 pr-4 py-2 rounded-full transition-all duration-300 flex items-center gap-2">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12m-6-6h12" />
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
                          className={`relative group p-4 rounded-lg cursor-pointer transition-all duration-300 hover:[box-shadow:0_0_15px_0_var(--tw-shadow-color)] hover:shadow-blue-400/75 dark:hover:shadow-blue-700/50 ${
                            selectedId === place.id
                              ? 'bg-blue-100 dark:bg-blue-900/20 border-2 border-blue-400 dark:border-blue-700'
                              : 'bg-white/70 dark:bg-gray-900/70 border border-gray-200/70 dark:border-gray-800/95 hover:bg-white/90 dark:hover:bg-gray-900/90 hover:border-gray-300 dark:hover:border-gray-700'
                          }`}>
                          <div className="flex items-start justify-between">
                            <div className="font-medium text-gray-900 dark:text-gray-100 group-hover:text-gray-700 dark:group-hover:text-gray-300 flex-1 transition-colors duration-300">
                              {place.name}
                              {selectedId === place.id && place.description.trim() !== '' && (
                                <div className="mt-2 mb-2">
                                  <p className="text-xs text-gray-600 dark:text-gray-400">
                                    {place.description.length > 80 ? `${place.description.substring(0, 80)}...` : place.description}
                                  </p>
                                </div>
                              )}
                            </div>
                            <button
                              onClick={(e) => handleInfoClick(e, place, 'place')}
                              className="ml-2 p-1 rounded-full bg-white dark:bg-gray-900 hover:bg-white/90 hover:border-gray-300 dark:hover:border-gray-700 border border-gray-200/70 dark:border-gray-800/95 shadow-sm dark:shadow-black/65 transition-all duration-300 flex-shrink-0"
                              aria-label="Plus d'informations"
                            >
                              <PlusIcon className="w-4 h-4 text-gray-400 dark:text-gray-400" />
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
                          {place.tags.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {place.tags.map(tag => (
                                <span 
                                  key={tag} 
                                  className="inline-block bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs px-2 py-1 rounded-full transition-colors duration-300"
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
                          className={`relative group p-4 rounded-lg cursor-pointer transition-all duration-300 hover:[box-shadow:0_0_15px_0_var(--tw-shadow-color)] hover:shadow-purple-400/75 dark:hover:shadow-purple-700/50 ${
                            selectedId === portal.id
                              ? 'bg-purple-100 dark:bg-purple-900/20 border-2 border-purple-400 dark:border-purple-700'
                              : 'bg-white/70 dark:bg-gray-900/70 border border-gray-200/70 dark:border-gray-800/95 hover:bg-white/90 dark:hover:bg-gray-900/90 hover:border-gray-300 dark:hover:border-gray-700'
                          }`}>
                          <div className="flex items-start justify-between">
                            <div className="font-medium text-gray-900 dark:text-gray-100 group-hover:text-gray-700 dark:group-hover:text-gray-300 flex-1 transition-colors duration-300">
                              {portal.name}
                              {(() => {
                                const displayDescription = portal.description.trim() !== ''
                                  ? portal.description
                                  : (portal['nether-associate'] && portal['nether-associate'].description.trim() !== '')
                                    ? portal['nether-associate'].description
                                    : '';

                                return selectedId === portal.id && displayDescription && (
                                  <div className="mt-2 mb-2">
                                    <p className="text-xs text-gray-600 dark:text-gray-400">
                                      {displayDescription.length > 80 ? `${displayDescription.substring(0, 80)}...` : displayDescription}
                                    </p>
                                  </div>
                                );
                              })()}
                            </div>
                            <button
                              onClick={(e) => handleInfoClick(e, portal, 'portal')}
                              className="ml-2 p-1 rounded-full bg-white dark:bg-gray-900 hover:bg-white/90 hover:border-gray-300 dark:hover:border-gray-700 border border-gray-200/70 dark:border-gray-800/95 shadow-sm dark:shadow-black/65 transition-all duration-300 flex-shrink-0"
                              aria-label="Plus d'informations"
                            >
                              <PlusIcon className="w-4 h-4 text-gray-400 dark:text-gray-400" />
                            </button>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={getWorldBadge(portal.world)}>
                              {portal.world}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400 transition-colors duration-300">
                              {portal.coordinates.x}, {portal.coordinates.y}, {portal.coordinates.z}
                            </span>
                            {portal.world === 'nether' && portal.address && (
                                <span className="text-xs text-gray-500 dark:text-gray-400 transition-colors duration-300 ml-auto">
                                    {portal.address}
                                </span>
                            )}
                          </div>
                          {portal['nether-associate'] && (
                            <div className="mt-2 pt-2 border-t border-gray-200/80 dark:border-gray-800/80 transition-colors duration-300">
                                <div className="flex items-center gap-2">
                                    <span className={getWorldBadge('nether')}>
                                    nether
                                    </span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400 transition-colors duration-300">
                                        {portal['nether-associate'].coordinates.x}, {portal['nether-associate'].coordinates.y}, {portal['nether-associate'].coordinates.z}
                                    </span>
                                    {portal['nether-associate'].address && (
                                        <span className="text-xs text-gray-500 dark:text-gray-400 transition-colors duration-300 ml-auto">
                                            {portal['nether-associate'].address}
                                        </span>
                                    )}
                                </div>
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