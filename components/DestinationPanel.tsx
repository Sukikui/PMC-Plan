'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type FocusEvent } from 'react';
import type React from 'react';
import DestinationPanelContent from '@/components/destination/DestinationPanelContent';
import DestinationPanelHeader from '@/components/destination/DestinationPanelHeader';
import type { DestinationCardActions } from '@/components/destination/destination-panel-types';
import { useDestinationPanelData } from '@/components/destination/useDestinationPanelData';
import { useRoutePlan } from '@/components/route/useRoutePlan';
import Panel from '@/components/ui/Panel';
import type { PlaceSummary, PortalSummary } from '@/lib/map-content/types';
import { OVERWORLD_MAP_WORLD, type MapWorld } from '@/lib/map/metadata';
import { themeColors } from '@/lib/theme-colors';
import {
  MAP_CONTROL_PANEL_COLLAPSED_HEIGHT_PX,
  MAP_CONTROL_PANEL_EXPANSION_TRANSITION_MS,
  panelScrollFadeStyle,
} from '@/lib/ui/panel';
import type { ManualRouteCoordinates, PlayerRoutePosition, RouteData } from '@/lib/route-planning';
import { toMapWorld, type DestinationType, type SelectDestinationHandler } from '@/lib/destination/selection';

interface DestinationPanelProps {
  activeMapWorld?: MapWorld;
  onPlaceSelect: SelectDestinationHandler;
  selectedId?: string;
  selectedType?: DestinationType;
  playerPosition?: PlayerRoutePosition | null;
  manualCoords?: ManualRouteCoordinates;
  onRouteChange?: (route: RouteData | null) => void;
  onInfoClick: (item: PlaceSummary | PortalSummary, type: DestinationType) => void;
}

const KEYBOARD_SCROLL_TOP_INSET_PX = 48;
const KEYBOARD_SCROLL_BOTTOM_EXTRA_GAP_PX = 8;
const KEYBOARD_SCROLL_BOTTOM_MIN_INSET_PX = 72;
const KEYBOARD_SCROLL_BOTTOM_MAX_INSET_PX = 128;
const KEYBOARD_SCROLL_BOTTOM_CONTAINER_RATIO = 0.28;

export default function DestinationPanel({
  activeMapWorld = OVERWORLD_MAP_WORLD,
  onPlaceSelect,
  selectedId,
  selectedType = 'place',
  playerPosition,
  manualCoords,
  onRouteChange,
  onInfoClick,
}: DestinationPanelProps) {
  const [enabledTags, setEnabledTags] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [tagFilterLogic, setTagFilterLogic] = useState<'SINGLE' | 'OR' | 'AND'>('SINGLE');
  const [isPanelHovered, setIsPanelHovered] = useState(false);
  const [hasPanelFocus, setHasPanelFocus] = useState(false);
  const [hasSearchFocus, setHasSearchFocus] = useState(false);
  const [isSearchHighlightActive, setIsSearchHighlightActive] = useState(false);
  const [highlightedDestinationIndex, setHighlightedDestinationIndex] = useState(0);
  const contentScrollRef = useRef<HTMLDivElement | null>(null);
  const destinationCardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const {
    allTags,
    filteredDestinations,
    filteredPlaces,
    filteredPortals,
    loading,
    places,
    portals,
  } = useDestinationPanelData(enabledTags, tagFilterLogic, searchQuery);
  const {
    route,
    loading: routeLoading,
    error: routeError,
    hasOrigin,
  } = useRoutePlan({ selectedId, playerPosition, manualCoords });

  useEffect(() => {
    onRouteChange?.(route);
  }, [onRouteChange, route]);

  const toggleTagFilterLogic = useCallback(() => {
    setTagFilterLogic((prev) => {
      const newMode = prev === 'SINGLE' ? 'OR' : prev === 'OR' ? 'AND' : 'SINGLE';
      if (newMode === 'SINGLE' && enabledTags.size > 1) {
        setEnabledTags(new Set());
      }
      return newMode;
    });
  }, [enabledTags.size]);

  const toggleTag = useCallback((tag: string) => {
    setEnabledTags((currentTags) => {
      const nextTags = new Set(currentTags);
      if (tagFilterLogic === 'SINGLE') {
        if (nextTags.has(tag)) {
          nextTags.delete(tag);
        } else {
          nextTags.clear();
          nextTags.add(tag);
        }
      } else if (nextTags.has(tag)) {
        nextTags.delete(tag);
      } else {
        nextTags.add(tag);
      }
      return nextTags;
    });
  }, [tagFilterLogic]);

  const resetSearchHighlight = useCallback(() => {
    setIsSearchHighlightActive(false);
    setHighlightedDestinationIndex(0);
  }, []);

  const handleDestinationClick = useCallback((
    id: string,
    type: DestinationType,
    world: string,
    source: 'keyboard' | 'mouse' = 'mouse'
  ) => {
    if (source === 'mouse') {
      resetSearchHighlight();
    } else {
      setIsSearchHighlightActive(true);
    }

    const destinationWorld = toMapWorld(world);
    onPlaceSelect(
      selectedId === id && activeMapWorld === destinationWorld ? '' : id,
      type,
      destinationWorld
    );
  }, [activeMapWorld, onPlaceSelect, resetSearchHighlight, selectedId]);

  const handleInfoClick = useCallback((event: React.MouseEvent, item: PlaceSummary | PortalSummary, type: DestinationType) => {
    event.stopPropagation();
    onInfoClick(item, type);
  }, [onInfoClick]);

  const handlePanelBlur = (event: FocusEvent<HTMLDivElement>) => {
    const nextFocusedElement = event.relatedTarget;
    if (!(nextFocusedElement instanceof Node) || !event.currentTarget.contains(nextFocusedElement)) {
      setHasPanelFocus(false);
    }
  };

  const selectedPlace = selectedType === 'place' && selectedId
    ? places.find((place) => place.id === selectedId)
    : undefined;
  const selectedPortal = selectedType === 'portal' && selectedId
    ? portals.find((portal) => portal.id === selectedId)
    : undefined;
  const hasSelectedDestination = Boolean(selectedPlace || selectedPortal);
  const highlightedDestination = filteredDestinations[highlightedDestinationIndex] ?? filteredDestinations[0] ?? null;
  const selectedMatchesHighlightedDestination = Boolean(
    highlightedDestination &&
    selectedId === highlightedDestination.id &&
    selectedType === highlightedDestination.type
  );
  const shouldHighlightDestination = isSearchHighlightActive && hasSearchFocus && !hasSelectedDestination && !loading;
  const isPanelExpanded = isPanelHovered || hasPanelFocus || hasSelectedDestination;
  const contentHeight = `calc(100vh - 2rem - ${MAP_CONTROL_PANEL_COLLAPSED_HEIGHT_PX}px)`;

  useEffect(() => {
    setHighlightedDestinationIndex(0);
  }, [searchQuery, enabledTags, tagFilterLogic]);

  useEffect(() => {
    if (highlightedDestinationIndex >= filteredDestinations.length) {
      setHighlightedDestinationIndex(Math.max(0, filteredDestinations.length - 1));
    }
  }, [filteredDestinations.length, highlightedDestinationIndex]);

  useEffect(() => {
    if (!shouldHighlightDestination || !highlightedDestination) return;

    const animationFrameId = window.requestAnimationFrame(() => {
      const highlightedCard = destinationCardRefs.current[`${highlightedDestination.type}-${highlightedDestination.id}`];
      const scrollContainer = contentScrollRef.current;
      if (!highlightedCard || !scrollContainer) return;

      scrollHighlightedDestinationIntoView(highlightedCard, scrollContainer);
    });

    return () => window.cancelAnimationFrame(animationFrameId);
  }, [highlightedDestination, shouldHighlightDestination]);

  const cardActions = useMemo<DestinationCardActions>(() => ({
    selectedId,
    highlightedDestination,
    shouldHighlightDestination,
    setCardRef: (key, element) => {
      destinationCardRefs.current[key] = element;
    },
    onMouseEnter: resetSearchHighlight,
    onDestinationClick: handleDestinationClick,
    onInfoClick: handleInfoClick,
  }), [handleDestinationClick, handleInfoClick, highlightedDestination, resetSearchHighlight, selectedId, shouldHighlightDestination]);

  return (
    <Panel
      data-map-panel
      className="fixed left-4 top-4 z-50 flex max-h-[calc(100vh-2rem)] w-[calc(100vw-2rem)] max-w-96 flex-col overflow-hidden"
      onMouseEnter={() => setIsPanelHovered(true)}
      onMouseLeave={() => setIsPanelHovered(false)}
      onFocus={() => setHasPanelFocus(true)}
      onBlur={handlePanelBlur}
    >
      <div
        className={`flex flex-shrink-0 flex-col justify-between border-b px-6 py-6 ${themeColors.border.primary} ${themeColors.transition}`}
        style={{ height: `${MAP_CONTROL_PANEL_COLLAPSED_HEIGHT_PX - 2}px` }}
      >
        <DestinationPanelHeader
          allTags={allTags}
          enabledTags={enabledTags}
          tagFilterLogic={tagFilterLogic}
          searchQuery={searchQuery}
          highlightedDestination={highlightedDestination}
          hasSelectedDestination={hasSelectedDestination}
          isSearchHighlightActive={isSearchHighlightActive}
          selectedMatchesHighlightedDestination={selectedMatchesHighlightedDestination}
          filteredDestinationsLength={filteredDestinations.length}
          onClearTags={() => setEnabledTags(new Set())}
          onSearchBlur={() => setHasSearchFocus(false)}
          onSearchFocus={() => {
            setHasSearchFocus(true);
            setIsSearchHighlightActive(true);
          }}
          onSearchQueryChange={setSearchQuery}
          onSelectHighlightedDestination={(destination) => {
            handleDestinationClick(destination.id, destination.type, destination.world, 'keyboard');
          }}
          onSetHighlightedDestinationIndex={setHighlightedDestinationIndex}
          onSetSearchHighlightActive={setIsSearchHighlightActive}
          onToggleTag={toggleTag}
          onToggleTagFilterLogic={toggleTagFilterLogic}
        />
      </div>

      <div
        className={`relative shrink-0 rounded-b-xl overflow-hidden transition-[height,opacity] ease-out ${isPanelExpanded ? 'opacity-100' : 'opacity-0'}`}
        style={{
          height: isPanelExpanded ? contentHeight : '0px',
          transitionDuration: `${MAP_CONTROL_PANEL_EXPANSION_TRANSITION_MS}ms`,
        }}
      >
        <div
          ref={contentScrollRef}
          className={`h-full overflow-y-auto px-6 pb-16 pt-9 [&::-webkit-scrollbar]:hidden ${themeColors.transition}`}
          style={{
            ...panelScrollFadeStyle,
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          <DestinationPanelContent
            actions={cardActions}
            filteredPlaces={filteredPlaces}
            filteredPortals={filteredPortals}
            hasOrigin={hasOrigin}
            loading={loading}
            route={route}
            routeError={routeError}
            routeLoading={routeLoading}
            selectedPlace={selectedPlace}
            selectedPortal={selectedPortal}
          />
        </div>
      </div>
    </Panel>
  );
}

function scrollHighlightedDestinationIntoView(
  highlightedCard: HTMLDivElement,
  scrollContainer: HTMLDivElement
) {
  const cardRect = highlightedCard.getBoundingClientRect();
  const containerRect = scrollContainer.getBoundingClientRect();
  const cardTop = scrollContainer.scrollTop + cardRect.top - containerRect.top;
  const cardBottom = cardTop + cardRect.height;
  const bottomInset = Math.min(
    Math.max(cardRect.height + KEYBOARD_SCROLL_BOTTOM_EXTRA_GAP_PX, KEYBOARD_SCROLL_BOTTOM_MIN_INSET_PX),
    Math.min(KEYBOARD_SCROLL_BOTTOM_MAX_INSET_PX, scrollContainer.clientHeight * KEYBOARD_SCROLL_BOTTOM_CONTAINER_RATIO)
  );
  const visibleTop = scrollContainer.scrollTop + KEYBOARD_SCROLL_TOP_INSET_PX;
  const visibleBottom = scrollContainer.scrollTop + scrollContainer.clientHeight - bottomInset;
  const nextScrollTop = cardTop < visibleTop
    ? cardTop - KEYBOARD_SCROLL_TOP_INSET_PX
    : cardBottom > visibleBottom
      ? cardBottom - scrollContainer.clientHeight + bottomInset
      : null;

  if (nextScrollTop === null) return;

  const maxScrollTop = scrollContainer.scrollHeight - scrollContainer.clientHeight;
  scrollContainer.scrollTo({
    top: Math.min(Math.max(nextScrollTop, 0), maxScrollTop),
    behavior: 'smooth',
  });
}
