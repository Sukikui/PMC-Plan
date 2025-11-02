'use client';

import { useState, useEffect } from 'react';
import ClearIcon from './icons/ClearIcon';
import PlusIcon from './icons/PlusIcon';

import { Portal, Place } from '../app/api/utils/shared';
import { getWorldBadge } from '../lib/ui-utils';
import { themeColors } from '../lib/theme-colors';

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
  const [tagFilterLogic, setTagFilterLogic] = useState<'SINGLE' | 'OR' | 'AND'>('SINGLE');
  

  const toggleTagFilterLogic = () => {
    setTagFilterLogic(prev => {
      const newMode = prev === 'SINGLE' ? 'OR' : prev === 'OR' ? 'AND' : 'SINGLE';
      
      // Si on passe en mode SINGLE avec plusieurs tags sélectionnés, tout déselectionner
      if (newMode === 'SINGLE' && enabledTags.size > 1) {
        setEnabledTags(new Set());
      }
      
      return newMode;
    });
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
      tagFilterLogic === 'SINGLE' || tagFilterLogic === 'OR'
        ? place.tags.some(tag => enabledTags.has(tag))
        : Array.from(enabledTags).every(enabledTag => place.tags.includes(enabledTag))
    );

    // Filter by search query
    const searchMatch = searchQuery === '' || 
      place.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (place.description && place.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      place.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
      place.world.toLowerCase().includes(searchQuery.toLowerCase());

    return tagMatch && searchMatch;
  });

  // Filter portals by search query (exclude portals when tags are active)
  const filteredPortals = enabledTags.size > 0 ? [] : portals.filter(portal => {
    return searchQuery === '' || 
      portal.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (portal.description && portal.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      portal.world.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const toggleTag = (tag: string) => {
    const newEnabledTags = new Set(enabledTags);
    
    if (tagFilterLogic === 'SINGLE') {
      // En mode SINGLE : sélectionner uniquement ce tag
      if (newEnabledTags.has(tag)) {
        newEnabledTags.delete(tag); // Déselectionner si déjà sélectionné
      } else {
        newEnabledTags.clear(); // Effacer tous les autres tags
        newEnabledTags.add(tag); // Ajouter uniquement ce tag
      }
    } else {
      // En mode OR/AND : comportement normal
      if (newEnabledTags.has(tag)) {
        newEnabledTags.delete(tag);
      } else {
        newEnabledTags.add(tag);
      }
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
    <div className={`fixed top-4 left-4 h-[calc(100vh-2rem)] w-96 ${themeColors.panel.primary} ${themeColors.blur} ${themeColors.shadow.panel} ${themeColors.util.roundedXl} border ${themeColors.border.primary} z-50 flex flex-col ${themeColors.transition}`}>
      {/* Header */}
      <div className={`flex-shrink-0 p-6 border-b ${themeColors.border.primary} ${themeColors.panel.primary} ${themeColors.blurSm} rounded-t-xl ${themeColors.transition}`}>
        {/* Tag Filters */}
        <div>
          <div className={`text-xs font-semibold ${themeColors.text.secondary} mb-2 ${themeColors.util.uppercase} ${themeColors.transition}`}>Filtrer par tags</div>
          <div className="flex flex-wrap gap-1">
            <button
              onClick={toggleTagFilterLogic}
              className={`w-10 py-1 px-2 ${themeColors.util.roundedFull} border ${themeColors.transition} font-semibold flex items-center justify-center ${themeColors.tag.filterLogic}`}
              title={`Mode actuel: ${tagFilterLogic === 'SINGLE' ? 'Un seul tag' : tagFilterLogic === 'OR' ? 'OU (au moins un tag)' : 'ET (tous les tags)'}`}
            >
              {tagFilterLogic === 'SINGLE' ? (
                <svg className="w-4 h-4" viewBox="-2 0 28 24" fill="none" stroke="currentColor" strokeWidth="2" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="8" fill="currentColor" />
                </svg>
              ) : tagFilterLogic === 'OR' ? (
                <svg className="w-4 h-4" viewBox="-2 0 28 24" fill="none" stroke="currentColor" strokeWidth="2" xmlns="http://www.w3.org/2000/svg" style={{overflow: 'visible'}}>
                  <circle cx="5" cy="12" r="8" fill="currentColor" />
                  <circle cx="19" cy="12" r="8" />
                </svg>
              ) : (
                <svg className="w-4 h-4" viewBox="-2 0 28 24" fill="none" stroke="currentColor" strokeWidth="2" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="7" cy="12" r="8" />
                  <circle cx="17" cy="12" r="8" />
                  <ellipse cx="12" cy="12" rx="3" ry="5.6" fill="currentColor"/>
                </svg>
              )}
            </button>
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`px-2 py-1 text-xs ${themeColors.util.roundedFull} border ${themeColors.transition} ${
                  enabledTags.has(tag)
                    ? themeColors.tag.active
                    : `${themeColors.tag.inactive}`
                }`}
              >
                {tag}
              </button>
            ))}
            {enabledTags.size > 0 && (
              <button
                onClick={() => setEnabledTags(new Set())}
                className={`flex items-center justify-center ${themeColors.text.secondary} ${themeColors.interactive.hoverText} ${themeColors.transition}`}
                aria-label="Effacer les tags"
              >
                <ClearIcon className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Search Bar */}
        <div className="mt-6">
          <div className={`text-xs font-semibold ${themeColors.text.secondary} mb-2 ${themeColors.util.uppercase} ${themeColors.transition}`}>Rechercher</div>
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Nom, description, tags, monde..."
              className={`w-full px-3 py-2 text-sm ${themeColors.input.search} border ${themeColors.util.roundedLg} focus:outline-none focus:ring-2 ${themeColors.transition} ${themeColors.placeholder}`}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className={`absolute right-2 top-1/2 transform -translate-y-1/2 ${themeColors.text.secondary} ${themeColors.interactive.hoverText} ${themeColors.transition}`}
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
        <div className={`absolute top-0 left-0 right-0 h-3 ${themeColors.gradient.topSolid} z-10 pointer-events-none ${themeColors.transition}`} />
        <div className={`absolute top-3 left-0 right-0 h-8 ${themeColors.gradient.topBlur} z-10 pointer-events-none ${themeColors.transition}`} />
        
        {/* Scrollable list */}
        <div 
          className={`h-full overflow-y-auto pt-9 pb-16 px-6 [&::-webkit-scrollbar]:hidden ${themeColors.panel.primary} ${themeColors.transition}`} 
          style={{
            scrollbarWidth: 'none', 
            msOverflowStyle: 'none'
          }}
        >
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className={`${themeColors.text.tertiary} ${themeColors.transition}`}>Chargement...</div>
            </div>
          ) : (
            (filteredPlaces.length === 0 && filteredPortals.length === 0) ? (
              <div className={`flex flex-col items-center justify-center py-12 ${themeColors.destinationPanel.emptyStateText} text-center space-y-4`}>
                <p>Aucun résultat. (｡•́︿•̀｡)</p>
                <a href="https://github.com/Sukikui/PMC-Plan/issues/new/choose" target="_blank" rel="noopener noreferrer" className={`${themeColors.link} pl-3 pr-4 py-2 ${themeColors.util.roundedFull} ${themeColors.transitionAll} flex items-center gap-2`}>
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
                    <h3 className={`text-xs font-semibold ${themeColors.text.secondary} mb-3 ${themeColors.util.uppercase} ${themeColors.transition}`}>Lieux</h3>
                    <div className="space-y-2">
                      {filteredPlaces.map(place => (
                        <div
                          key={place.id}
                          onClick={() => handlePlaceClick(place.id, 'place')}
                          className={`relative group px-4 pb-4 pt-3 ${themeColors.util.roundedLg} cursor-pointer ${themeColors.transitionAll} ${themeColors.selection.place.hover} ${
                            selectedId === place.id
                              ? themeColors.selection.place.active
                              : `${themeColors.panel.secondary} border ${themeColors.border.secondary} ${themeColors.interactive.hoverPanel} ${themeColors.interactive.hoverBorder}`
                          }`}>
                          <div className="flex items-start justify-between">
                            <div className={`font-medium ${themeColors.text.primary} ${themeColors.interactive.groupHoverText} flex-1 ${themeColors.transition}`}>
                              {place.name}
                              {selectedId === place.id && place.description && place.description.trim() !== '' && (
                                <div className="mt-2 mb-2">
                                  <p className={`text-xs ${themeColors.text.secondary}`}>
                                    {place.description.length > 80 ? `${place.description.substring(0, 80)}...` : place.description}
                                  </p>
                                </div>
                              )}
                            </div>
                            <button
                              onClick={(e) => handleInfoClick(e, place, 'place')}
                              className={`ml-2 p-1 ${themeColors.util.roundedFull} ${themeColors.button.secondary} border ${themeColors.border.secondary} ${themeColors.shadow.button} ${themeColors.transitionAll} ${themeColors.util.hoverScale} ${themeColors.util.activeScale} flex-shrink-0 ${themeColors.interactive.hoverBorder}`}
                              aria-label="Plus d'informations"
                              style={{ marginTop: '4px' }}
                            >
                              <PlusIcon className={`w-4 h-4 ${themeColors.text.secondary}`} />
                            </button>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={getWorldBadge(place.world)}>
                              {place.world}
                            </span>
                            <span className={`text-xs ${themeColors.text.tertiary} ${themeColors.transition}`}>
                              {place.coordinates.x}, {place.coordinates.y}, {place.coordinates.z}
                            </span>
                          </div>
                          {place.tags.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {place.tags.map(tag => (
                                <span 
                                  key={tag} 
                                  className={`inline-block ${themeColors.tag.display} text-xs px-2 py-1 ${themeColors.util.roundedFull} ${themeColors.transition}`}
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
                    <h3 className={`text-xs font-semibold ${themeColors.text.secondary} mb-3 ${themeColors.util.uppercase} ${themeColors.transition}`}>Portails</h3>
                    <div className="space-y-2">
                      {filteredPortals.map(portal => (
                        <div
                          key={portal.id}
                          onClick={() => handlePlaceClick(portal.id, 'portal')}
                          className={`relative group px-4 pb-4 pt-3 ${themeColors.util.roundedLg} cursor-pointer ${themeColors.transitionAll} ${themeColors.selection.portal.hover} ${
                            selectedId === portal.id
                              ? themeColors.selection.portal.active
                              : `${themeColors.panel.secondary} border ${themeColors.border.secondary} ${themeColors.interactive.hoverPanel} ${themeColors.interactive.hoverBorder}`
                          }`}>
                          <div className="flex items-start justify-between">
                            <div className={`font-medium ${themeColors.text.primary} ${themeColors.interactive.groupHoverText} flex-1 ${themeColors.transition}`}>
                              {portal.name}
                              {(() => {
                                const displayDescription = portal.description && portal.description.trim() !== ''
                                  ? portal.description
                                  : (portal['nether-associate'] && portal['nether-associate'].description && portal['nether-associate'].description.trim() !== '')
                                    ? portal['nether-associate'].description
                                    : '';

                                return selectedId === portal.id && displayDescription && (
                                  <div className="mt-2 mb-2">
                                    <p className={`text-xs ${themeColors.text.secondary}`}>
                                      {displayDescription.length > 80 ? `${displayDescription.substring(0, 80)}...` : displayDescription}
                                    </p>
                                  </div>
                                );
                              })()}
                            </div>
                            <button
                              onClick={(e) => handleInfoClick(e, portal, 'portal')}
                              className={`ml-2 p-1 ${themeColors.util.roundedFull} ${themeColors.button.secondary} border ${themeColors.border.secondary} ${themeColors.shadow.button} ${themeColors.transitionAll} ${themeColors.util.hoverScale} ${themeColors.util.activeScale} flex-shrink-0 ${themeColors.interactive.hoverBorder}`}
                              aria-label="Plus d'informations"
                              style={{ marginTop: '4px' }}
                            >
                              <PlusIcon className={`w-4 h-4 ${themeColors.text.secondary}`} />
                            </button>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={getWorldBadge(portal.world)}>
                              {portal.world}
                            </span>
                            <span className={`text-xs ${themeColors.text.tertiary} ${themeColors.transition}`}>
                              {portal.coordinates.x}, {portal.coordinates.y}, {portal.coordinates.z}
                            </span>
                            {portal.world === 'nether' && portal.address && (
                                <span className={`text-xs ${themeColors.text.tertiary} ${themeColors.transition} ml-auto`}>
                                    {portal.address}
                                </span>
                            )}
                          </div>
                          {portal['nether-associate'] && (
                            <div className={`mt-2 pt-2 border-t ${themeColors.border.primary} ${themeColors.transition}`}>
                                <div className="flex items-center gap-2">
                                    <span className={getWorldBadge('nether')}>
                                    nether
                                    </span>
                                    <span className={`text-xs ${themeColors.text.tertiary} ${themeColors.transition}`}>
                                        {portal['nether-associate'].coordinates.x}, {portal['nether-associate'].coordinates.y}, {portal['nether-associate'].coordinates.z}
                                    </span>
                                    {portal['nether-associate'].address && (
                                        <span className={`text-xs ${themeColors.text.tertiary} ${themeColors.transition} ml-auto`}>
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
        <div className={`absolute bottom-0 left-0 right-0 h-2 ${themeColors.gradient.bottomSolid} z-10 pointer-events-none ${themeColors.transition}`} />
        <div className={`absolute bottom-2 left-0 right-0 h-8 ${themeColors.gradient.bottomBlur} z-10 pointer-events-none ${themeColors.transition}`} />
      </div>
    </div>
  );
}