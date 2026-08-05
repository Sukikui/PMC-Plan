'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import DestinationPanel from '@/components/DestinationPanel';
import PositionPanel from '@/components/PositionPanel';
import { useOverlay } from '@/components/overlay/OverlayProvider';
import SettingsPanel from '@/components/SettingsPanel';
import Overlay from '@/components/ui/Overlay';
import { useOverlayDisclosure } from '@/components/ui/useOverlayDisclosure';
import BetaLockScreen from '@/components/BetaLockScreen';
import StartupScreen from '@/components/StartupScreen';
import MainMapBackground from '@/components/map/MainMapBackground';
import RouteMapControls from '@/components/map/route/RouteMapControls';
import { themeColors } from '@/lib/theme-colors';
import { preloadStartupResources } from '@/lib/preload/startup';
import {
  loadGlobalTradeOverlay,
  loadSpaceExplorerOverlay,
} from '@/lib/preload/overlay-modules';
import { NETHER_MAP_WORLD, OVERWORLD_MAP_WORLD, type MapWorld } from '@/lib/map/metadata';
import { buildMapRoutePath, type MapRouteSegment } from '@/lib/map/route-path';
import type { PlayerData } from '@/lib/playercoords-api';
import type { DestinationType } from '@/lib/destination/selection';
import type { RouteData } from '@/lib/route-planning';

import type { PlaceSummary, PortalSummary } from '@/lib/map-content/types';
import { mapContentQueryOptions } from '@/lib/map-content/client';

const GlobalTradeOverlay = dynamic(loadGlobalTradeOverlay);
const SpaceExplorerOverlay = dynamic(loadSpaceExplorerOverlay);

export default function Home() {
  const queryClient = useQueryClient();
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string>('');
  const [selectedPlaceType, setSelectedPlaceType] = useState<DestinationType>('place');
  const [playerPosition, setPlayerPosition] = useState<PlayerData | null>(null);
  const [linkedMinecraftUuid, setLinkedMinecraftUuid] = useState<string | null>(null);
  const [manualCoords, setManualCoords] = useState<{x: string; y: string; z: string; world: 'overworld' | 'nether'}>({
    x: '', y: '', z: '', world: OVERWORLD_MAP_WORLD
  });
  const { openPlaceInfo, openSpaceInfo } = useOverlay();
  const marketOverlay = useOverlayDisclosure();
  const spaceExplorerOverlay = useOverlayDisclosure();
  const [startupPreloadComplete, setStartupPreloadComplete] = useState(false);
  const [activeMapWorld, setActiveMapWorld] = useState<MapWorld>(OVERWORLD_MAP_WORLD);
  const [route, setRoute] = useState<RouteData | null>(null);
  const [routeSelection, setRouteSelection] = useState<{
    routeKey: string;
    segmentId: string;
  } | null>(null);
  const routePath = useMemo(() => route ? buildMapRoutePath(route) : null, [route]);
  const activeRouteSegmentId = routeSelection && routeSelection.routeKey === routePath?.key
    ? routeSelection.segmentId
    : null;

  useEffect(() => {
    let cancelled = false;
    const minimumStartupDelay = new Promise((resolve) => setTimeout(resolve, 1000));

    Promise.all([
      preloadStartupResources(),
      queryClient.prefetchQuery(mapContentQueryOptions),
      minimumStartupDelay,
    ]).finally(() => {
      if (!cancelled) {
        setStartupPreloadComplete(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [queryClient]);

  const handlePlaceSelect = (id: string, type: DestinationType, world?: MapWorld) => {
    if (id !== selectedPlaceId) {
      setRoute(null);
      setRouteSelection(null);
    }

    if (id && world) {
      setActiveMapWorld(world);
    }

    setSelectedPlaceId(id);
    setSelectedPlaceType(type);
  };

  const handleInfoClick = (item: PlaceSummary | PortalSummary, type: 'place' | 'portal') => {
    openPlaceInfo(item, type, handlePlaceSelect);
  };

  const toggleNetherMap = () => {
    setActiveMapWorld((world) => (
      world === NETHER_MAP_WORLD ? OVERWORLD_MAP_WORLD : NETHER_MAP_WORLD
    ));
  };

  const handleRouteSegmentSelect = (segment: MapRouteSegment | null) => {
    if (!segment || !routePath) {
      setRouteSelection(null);
      return;
    }

    setRouteSelection({
      routeKey: routePath.key,
      segmentId: segment.id,
    });
    setActiveMapWorld(segment.world);
  };

  // Show lock screen if not unlocked and beta lock is not disabled
  const shouldShowLockScreen = process.env.NEXT_PUBLIC_DISABLE_BETA_LOCK !== 'true' && !isUnlocked;
  
  if (shouldShowLockScreen) {
    return <BetaLockScreen onUnlock={() => setIsUnlocked(true)} />;
  }

  // Show startup screen if beta lock is disabled and not unlocked yet
  if (process.env.NEXT_PUBLIC_DISABLE_BETA_LOCK === 'true' && !isUnlocked) {
    return <StartupScreen ready={startupPreloadComplete} onUnlock={() => setIsUnlocked(true)} />;
  }

  return (
    <div className={`relative h-screen overflow-hidden ${themeColors.mainScreen.noDestination} ${themeColors.transition}`}>
      <MainMapBackground
        world={activeMapWorld}
        onSelectItem={handlePlaceSelect}
        selectedId={selectedPlaceId}
        selectedType={selectedPlaceType}
        routePath={routePath}
        activeRouteSegmentId={activeRouteSegmentId}
        syncedPlayerUuid={playerPosition?.uuid}
        linkedMinecraftUuid={linkedMinecraftUuid}
      />

      <RouteMapControls
        routePath={routePath}
        activeSegmentId={activeRouteSegmentId}
        destinationType={selectedPlaceType}
        onSegmentSelect={handleRouteSegmentSelect}
      />

      {/* Left sliding panel */}
      <DestinationPanel
        activeMapWorld={activeMapWorld}
        onPlaceSelect={handlePlaceSelect}
        selectedId={selectedPlaceId}
        selectedType={selectedPlaceType}
        playerPosition={playerPosition}
        manualCoords={manualCoords}
        onRouteChange={setRoute}
        onInfoClick={handleInfoClick}
      />
      
      {/* Player overlay */}
      <PositionPanel
        onPlayerPositionChange={setPlayerPosition}
        onManualCoordsChange={setManualCoords}
      />
      
      {/* InfoOverlay is rendered globally by OverlayProvider */}

      {/* settings Panel */}
      <SettingsPanel
        onLinkedMinecraftUuidChange={setLinkedMinecraftUuid}
        onOpenMarket={marketOverlay.open}
        onOpenNetherMap={toggleNetherMap}
        onOpenSpaces={spaceExplorerOverlay.open}
        onSelectItem={handlePlaceSelect}
      />

      {/* Global Market button is rendered by SettingsPanel (absolute above trigger/panel) */}

      {/* Global Market Overlay */}
      {marketOverlay.isOpen && (
        <Overlay
          isOpen={marketOverlay.isOpen}
          onClose={marketOverlay.close}
          closing={marketOverlay.isClosing}
        >
          <GlobalTradeOverlay
            onClose={marketOverlay.close}
            onSelectItem={handlePlaceSelect}
          />
        </Overlay>
      )}

      {spaceExplorerOverlay.isOpen && (
        <Overlay
          isOpen={spaceExplorerOverlay.isOpen}
          onClose={spaceExplorerOverlay.close}
          closing={spaceExplorerOverlay.isClosing}
        >
          <SpaceExplorerOverlay
            onClose={spaceExplorerOverlay.close}
            onOpenSpace={openSpaceInfo}
          />
        </Overlay>
      )}

    </div>
  );
}
