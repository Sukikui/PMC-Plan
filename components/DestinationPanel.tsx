'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type FocusEvent } from 'react';
import type React from 'react';
import DestinationPanelContent from '@/components/destination/DestinationPanelContent';
import DestinationPanelHeader from '@/components/destination/DestinationPanelHeader';
import type { DestinationCardActions } from '@/components/destination/destination-panel-types';
import { useDestinationPanelData } from '@/components/destination/useDestinationPanelData';
import { useRoutePlan } from '@/components/route/useRoutePlan';
import type { Place, Portal } from '@/app/api/utils/shared';
import { OVERWORLD_MAP_WORLD, type MapWorld } from '@/lib/map/metadata';
import { themeColors } from '@/lib/theme-colors';
import type { ManualRouteCoordinates, PlayerRoutePosition } from '@/lib/route-planning';
import { toMapWorld, type DestinationType, type SelectDestinationHandler } from '@/lib/destination/selection';

interface DestinationPanelProps {
  activeMapWorld?: MapWorld;
  onPlaceSelect: SelectDestinationHandler;
  selectedId?: string;
  selectedType?: DestinationType;
  playerPosition?: PlayerRoutePosition | null;
  manualCoords?: ManualRouteCoordinates;
  onInfoClick: (item: Place | Portal, type: DestinationType) => void;
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
  const [headerHeight, setHeaderHeight] = useState(0);
  const headerRef = useRef<HTMLDivElement | null>(null);
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
    const header = headerRef.current;
    if (!header) return;

    const updateHeaderHeight = () => setHeaderHeight(header.getBoundingClientRect().height);
    updateHeaderHeight();
    window.addEventListener('resize', updateHeaderHeight);

    if (typeof ResizeObserver === 'undefined') {
      return () => window.removeEventListener('resize', updateHeaderHeight);
    }

    const resizeObserver = new ResizeObserver(updateHeaderHeight);
    resizeObserver.observe(header);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateHeaderHeight);
    };
  }, []);

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

  const handleInfoClick = useCallback((event: React.MouseEvent, item: Place | Portal, type: DestinationType) => {
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
  const contentHeight = headerHeight > 0 ? `calc(100vh - 2rem - ${headerHeight}px)` : '0px';

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
    <div
      className={`fixed top-4 left-4 max-h-[calc(100vh-2rem)] w-96 ${themeColors.panel.primary} ${themeColors.blur} ${themeColors.shadow.panel} ${themeColors.util.roundedXl} border ${themeColors.border.primary} z-50 flex flex-col overflow-hidden ${themeColors.transition}`}
      onMouseEnter={() => setIsPanelHovered(true)}
      onMouseLeave={() => setIsPanelHovered(false)}
      onFocus={() => setHasPanelFocus(true)}
      onBlur={handlePanelBlur}
    >
      <div
        ref={headerRef}
        className={`flex-shrink-0 p-6 border-b ${themeColors.border.primary} ${themeColors.panel.primary} ${themeColors.blurSm} rounded-t-xl ${themeColors.transition}`}
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
        className={`relative shrink-0 rounded-b-xl overflow-hidden transition-[height,opacity] duration-300 ease-out ${isPanelExpanded ? 'opacity-100' : 'opacity-0'}`}
        style={{ height: isPanelExpanded ? contentHeight : '0px' }}
      >
        <div className={`absolute top-0 left-0 right-0 h-3 ${themeColors.gradient.topSolid} z-10 pointer-events-none ${themeColors.transition}`} />
        <div className={`absolute top-3 left-0 right-0 h-8 ${themeColors.gradient.topBlur} z-10 pointer-events-none ${themeColors.transition}`} />
        <div
          ref={contentScrollRef}
          className={`h-full overflow-y-auto pt-9 pb-16 px-6 [&::-webkit-scrollbar]:hidden ${themeColors.panel.primary} ${themeColors.transition}`}
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
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
        <div className={`absolute bottom-0 left-0 right-0 h-2 ${themeColors.gradient.bottomSolid} z-10 pointer-events-none ${themeColors.transition}`} />
        <div className={`absolute bottom-2 left-0 right-0 h-8 ${themeColors.gradient.bottomBlur} z-10 pointer-events-none ${themeColors.transition}`} />
      </div>
    </div>
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
