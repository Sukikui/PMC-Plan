import { useCallback, useEffect, useMemo, useState } from 'react';
import type { MapMetadata } from '@/lib/map/metadata';
import { getMapDrawRect } from '../core/map-geometry';
import {
  getMapGridCellAtScreenPosition,
  type MapGridCell,
  type MapScreenPosition,
} from '../core/map-grid';
import type { MapPan, MapSize, MapViewport } from '../core/map-view';

interface UseMapGridInteractionOptions {
  baseSize: MapSize;
  enabled: boolean;
  metadata: MapMetadata;
  pan: MapPan;
  resetKey: string;
  viewport: MapViewport;
  zoom: number;
}

export function useMapGridInteraction({
  baseSize,
  enabled,
  metadata,
  pan,
  resetKey,
  viewport,
  zoom,
}: UseMapGridInteractionOptions) {
  const [hoveredCell, setHoveredCell] = useState<MapGridCell | null>(null);
  const [selectedCell, setSelectedCell] = useState<MapGridCell | null>(null);
  const drawRect = useMemo(
    () => getMapDrawRect(viewport, baseSize, zoom, pan),
    [baseSize, pan, viewport, zoom],
  );
  const resolveCell = useCallback((position: MapScreenPosition) => (
    enabled
      ? getMapGridCellAtScreenPosition(metadata, drawRect, position)
      : null
  ), [drawRect, enabled, metadata]);
  const updateHover = useCallback((position: MapScreenPosition | null) => {
    const nextCell = position ? resolveCell(position) : null;
    setHoveredCell((currentCell) => (
      currentCell?.coordinates.x === nextCell?.coordinates.x
      && currentCell?.coordinates.z === nextCell?.coordinates.z
        ? currentCell
        : nextCell
    ));
  }, [resolveCell]);
  const selectCell = useCallback((position: MapScreenPosition) => {
    const cell = resolveCell(position);
    setHoveredCell(cell);
    setSelectedCell(cell);
    return cell;
  }, [resolveCell]);
  const clearHover = useCallback(() => setHoveredCell(null), []);
  const clearSelection = useCallback(() => setSelectedCell(null), []);

  useEffect(() => {
    setHoveredCell(null);
    setSelectedCell(null);
  }, [resetKey]);

  useEffect(() => {
    if (!enabled) {
      setHoveredCell(null);
      setSelectedCell(null);
    }
  }, [enabled]);

  return {
    clearHover,
    clearSelection,
    hoveredCell,
    selectCell,
    selectedCell,
    updateHover,
  };
}
