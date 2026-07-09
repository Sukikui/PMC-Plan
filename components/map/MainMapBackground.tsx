'use client';

import { useMemo } from 'react';
import InteractiveMapRenderer from '@/components/map/layers/InteractiveMapRenderer';
import { useWorldMapPoints } from '@/components/map/hooks/useOverworldMapPoints';
import { useOverlay } from '@/components/overlay/OverlayProvider';
import type { SelectDestinationHandler } from '@/lib/destination/selection';
import { mapMetadataByWorld, NETHER_MAP_WORLD, OVERWORLD_MAP_WORLD, type MapWorld } from '@/lib/map/metadata';
import { netherAxisLineOverlays } from '@/lib/map/nether-overlays';
import { themeColors } from '@/lib/theme-colors';

interface MainMapBackgroundProps {
  world?: MapWorld;
  onSelectItem?: SelectDestinationHandler;
  selectedId?: string;
  selectedType?: 'place' | 'portal';
}

export default function MainMapBackground({
  world = OVERWORLD_MAP_WORLD,
  onSelectItem,
  selectedId,
  selectedType,
}: MainMapBackgroundProps) {
  const { openPlaceInfo } = useOverlay();
  const { points, pointById, loading, error } = useWorldMapPoints(world);
  const metadata = mapMetadataByWorld[world];
  const lineOverlays = useMemo(() => (
    world === NETHER_MAP_WORLD
      ? netherAxisLineOverlays.map((overlay) => ({
          ...overlay,
          strokeStyle: themeColors.map.transitionLineStroke,
          strokeOpacity: themeColors.map.transitionLineOpacity,
        }))
      : []
  ), [world]);
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
        metadata={metadata}
        points={points}
        loading={loading}
        error={error}
        variant="background"
        world={world}
        lineOverlays={lineOverlays}
        focusedPointId={focusedPointId}
        onPointSelect={(point) => {
          const selectedPoint = pointById.get(point.id);
          if (selectedPoint) {
            openPlaceInfo(selectedPoint.item, selectedPoint.itemType, onSelectItem);
          }
        }}
      />
    </div>
  );
}
