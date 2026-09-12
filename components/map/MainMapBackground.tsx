'use client';

import { useMemo } from 'react';
import InteractiveMapRenderer from '@/components/map/layers/InteractiveMapRenderer';
import { useWorldMapPoints } from '@/components/map/hooks/useOverworldMapPoints';
import { useOverlay } from '@/components/overlay/OverlayProvider';
import { mapMetadataByWorld, NETHER_MAP_WORLD, OVERWORLD_MAP_WORLD, type MapWorld } from '@/lib/map/metadata';
import { netherAxisLineOverlays } from '@/lib/map/nether-overlays';
import type { MapRoutePath } from '@/lib/map/route-path';
import { themeColors } from '@/lib/theme-colors';
import type { MapPreviewArea } from './core/map-view';
import { useMapAppearance } from '@/components/preferences/PreferencesProvider';

const previewAreas: Record<MapWorld, MapPreviewArea> = {
  overworld: { x: 0, z: -2550, width: 1760, height: 1650 },
  nether: { x: 0, z: 0, width: 1760, height: 1650 },
};

interface MainMapBackgroundProps {
  preview?: boolean;
  previewImagePortalRoot?: HTMLElement | null;
  world?: MapWorld;
  selectedId?: string;
  selectedType?: 'place' | 'portal';
  routePath?: MapRoutePath | null;
  activeRouteSegmentId?: string | null;
  syncedPlayerUuid?: string | null;
  linkedMinecraftUuid?: string | null;
  onClearSelection?: () => void;
}

export default function MainMapBackground({
  preview = false,
  previewImagePortalRoot,
  world = OVERWORLD_MAP_WORLD,
  selectedId,
  selectedType,
  routePath,
  activeRouteSegmentId,
  syncedPlayerUuid,
  linkedMinecraftUuid,
  onClearSelection,
}: MainMapBackgroundProps) {
  const { openPlaceInfo } = useOverlay();
  const { netherAxesEnabled } = useMapAppearance();
  const { points, pointById, loading, error } = useWorldMapPoints(world);
  const metadata = mapMetadataByWorld[world];
  const lineOverlays = useMemo(() => (
    world === NETHER_MAP_WORLD && netherAxesEnabled
      ? netherAxisLineOverlays.map((overlay) => ({
          ...overlay,
          strokeStyle: themeColors.map.transitionLineStroke,
          strokeOpacity: themeColors.map.transitionLineOpacity,
        }))
      : []
  ), [netherAxesEnabled, world]);
  const focusedPointId = useMemo(() => {
    if (!selectedId || !selectedType) {
      return undefined;
    }

    return points.find((point) => (
      point.itemType === selectedType &&
      point.item.id === selectedId
    ))?.id;
  }, [points, selectedId, selectedType]);

  return (
    <div className="absolute inset-0 z-0">
      <InteractiveMapRenderer
        previewArea={preview ? previewAreas[world] : undefined}
        previewImagePortalRoot={previewImagePortalRoot}
        metadata={metadata}
        points={points}
        loading={loading}
        error={error}
        variant="background"
        world={world}
        lineOverlays={lineOverlays}
        focusedPointId={focusedPointId}
        routePath={routePath}
        activeRouteSegmentId={activeRouteSegmentId}
        enableGridContentCreation={!preview}
        syncedPlayerUuid={syncedPlayerUuid}
        linkedMinecraftUuid={linkedMinecraftUuid}
        onMapClick={preview ? undefined : onClearSelection}
        onPointSelect={preview ? undefined : (point) => {
          const selectedPoint = pointById.get(point.id);
          if (selectedPoint) {
            openPlaceInfo(selectedPoint.item, selectedPoint.itemType);
          }
        }}
      />
    </div>
  );
}
