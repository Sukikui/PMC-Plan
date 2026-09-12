import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  hoverEnabled: boolean;
  metadata: MapMetadata;
  pan: MapPan;
  resetKey: string;
  selectionEnabled: boolean;
  viewport: MapViewport;
  zoom: number;
}

export function useMapGridInteraction({
  baseSize,
  hoverEnabled,
  metadata,
  pan,
  resetKey,
  selectionEnabled,
  viewport,
  zoom,
}: UseMapGridInteractionOptions) {
  const [hoveredCell, setHoveredCell] = useState<MapGridCell | null>(null);
  const [selectedCell, setSelectedCell] = useState<MapGridCell | null>(null);
  const hoverPositionRef = useRef<MapScreenPosition | null>(null);
  const drawRect = useMemo(
    () => getMapDrawRect(viewport, baseSize, zoom, pan),
    [baseSize, pan, viewport, zoom],
  );
  const resolveCell = useCallback((position: MapScreenPosition) => (
    getMapGridCellAtScreenPosition(metadata, drawRect, position)
  ), [drawRect, metadata]);
  const updateHover = useCallback((position: MapScreenPosition | null) => {
    hoverPositionRef.current = position;
    const nextCell = hoverEnabled && position ? resolveCell(position) : null;
    setHoveredCell((currentCell) => (
      currentCell?.coordinates.x === nextCell?.coordinates.x
      && currentCell?.coordinates.z === nextCell?.coordinates.z
        ? currentCell
        : nextCell
    ));
  }, [hoverEnabled, resolveCell]);
  const selectCell = useCallback((position: MapScreenPosition) => {
    if (!selectionEnabled) return null;
    const cell = resolveCell(position);
    setHoveredCell(cell);
    setSelectedCell(cell);
    return cell;
  }, [resolveCell, selectionEnabled]);
  const clearHover = useCallback(() => {
    hoverPositionRef.current = null;
    setHoveredCell(null);
  }, []);
  const clearSelection = useCallback(() => setSelectedCell(null), []);

  useEffect(() => {
    hoverPositionRef.current = null;
    setHoveredCell(null);
    setSelectedCell(null);
  }, [resetKey]);

  useEffect(() => {
    const position = hoverPositionRef.current;
    if (!hoverEnabled || !position) {
      setHoveredCell(null);
      return;
    }
    setHoveredCell(resolveCell(position));
  }, [hoverEnabled, resolveCell]);

  useEffect(() => {
    if (!selectionEnabled) setSelectedCell(null);
  }, [selectionEnabled]);

  return {
    clearHover,
    clearSelection,
    hoveredCell,
    selectCell,
    selectedCell,
    updateHover,
  };
}
