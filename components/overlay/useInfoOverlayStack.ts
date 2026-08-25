'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import type { Place, Portal } from '@/lib/api/types';
import type { PlaceSummary, PortalSummary } from '@/lib/map-content/types';
import type { MapEntryManagement } from '@/lib/map-entry/types';
import { getMapEntryManagementPatch } from '@/lib/map-entry/client-updates';
import type { Space, SpaceReference, SpaceSummary } from '@/lib/spaces/types';
import {
  pushBoundedInfoLayer,
  removeInfoLayersForContent,
  type InfoOverlayContentTarget,
  type InfoOverlayType,
} from '@/lib/ui/info-overlay-stack';
import { OVERLAY_TRANSITION_MS } from '@/lib/ui/overlay';

export interface InfoOverlayLayer {
  id: number;
  isClosing: boolean;
  item: Place | Portal | PlaceSummary | PortalSummary | Space | SpaceReference | SpaceSummary;
  type: InfoOverlayType;
}

type LayerUpdater = (
  current: InfoOverlayLayer[],
) => InfoOverlayLayer[];

export function useInfoOverlayStack() {
  const [layers, setLayers] = useState<InfoOverlayLayer[]>([]);
  const layersRef = useRef<InfoOverlayLayer[]>([]);
  const nextIdRef = useRef(1);
  const closeTimeoutsRef = useRef(
    new Map<number, ReturnType<typeof setTimeout>>(),
  );

  const updateLayers = useCallback((updater: LayerUpdater) => {
    setLayers((current) => {
      const next = updater(current);
      layersRef.current = next;
      return next;
    });
  }, []);

  const clearClose = useCallback((layerId: number) => {
    const timeout = closeTimeoutsRef.current.get(layerId);
    if (!timeout) return;
    clearTimeout(timeout);
    closeTimeoutsRef.current.delete(layerId);
  }, []);

  useEffect(() => () => {
    closeTimeoutsRef.current.forEach(clearTimeout);
    closeTimeoutsRef.current.clear();
  }, []);

  const open = useCallback((
    item: Place | Portal | PlaceSummary | PortalSummary | Space | SpaceReference | SpaceSummary,
    type: InfoOverlayType,
  ) => {
    const layer: InfoOverlayLayer = {
      id: nextIdRef.current++,
      isClosing: false,
      item,
      type,
    };
    const nextLayers = pushBoundedInfoLayer(layersRef.current, layer);
    const retainedIds = new Set(nextLayers.map(({ id }) => id));
    layersRef.current
      .filter(({ id }) => !retainedIds.has(id))
      .forEach(({ id }) => clearClose(id));
    updateLayers(() => nextLayers);
  }, [clearClose, updateLayers]);

  const close = useCallback((layerId: number) => {
    if (closeTimeoutsRef.current.has(layerId)) return;

    updateLayers((current) => current.map((layer) => (
      layer.id === layerId ? { ...layer, isClosing: true } : layer
    )));
    closeTimeoutsRef.current.set(layerId, setTimeout(() => {
      closeTimeoutsRef.current.delete(layerId);
      updateLayers((current) => (
        current.filter((layer) => layer.id !== layerId)
      ));
    }, OVERLAY_TRANSITION_MS));
  }, [updateLayers]);

  const closeTop = useCallback(() => {
    const topLayer = layersRef.current[layersRef.current.length - 1];
    if (topLayer) close(topLayer.id);
  }, [close]);

  const updateMapEntry = useCallback((
    item: Place | Portal,
    type: 'place' | 'portal',
  ) => {
    updateLayers((current) => current.map((layer) => (
      layer.type === type
      && 'mapEntryId' in layer.item
      && layer.item.mapEntryId === item.mapEntryId
        ? { ...layer, item }
        : layer
    )));
  }, [updateLayers]);

  const applyManagementUpdate = useCallback((
    management: MapEntryManagement,
  ) => {
    const patch = getMapEntryManagementPatch(management);
    updateLayers((current) => current.map((layer) => (
      layer.type !== 'space'
      && 'mapEntryId' in layer.item
      && layer.item.mapEntryId === management.access.mapEntryId
        ? { ...layer, item: { ...layer.item, ...patch } }
        : layer
    )));
  }, [updateLayers]);

  const updateSpace = useCallback((space: Space) => {
    updateLayers((current) => current.map((layer) => {
      if (layer.type === 'space' && layer.item.id === space.id) {
        return { ...layer, item: space };
      }
      if ('space' in layer.item && layer.item.space?.id === space.id) {
        return { ...layer, item: { ...layer.item, space } };
      }
      return layer;
    }));
  }, [updateLayers]);

  const removeContent = useCallback((target: InfoOverlayContentTarget) => {
    const retainedLayers = removeInfoLayersForContent(
      layersRef.current,
      target,
    );
    const retainedIds = new Set(retainedLayers.map(({ id }) => id));
    const removedLayers = layersRef.current.filter(({ id }) => (
      !retainedIds.has(id)
    ));
    removedLayers.forEach((layer) => clearClose(layer.id));
    updateLayers((current) => current.flatMap((layer) => {
      if (!retainedIds.has(layer.id)) return [];
      if (
        target.kind === 'space'
        && 'space' in layer.item
        && layer.item.space?.id === target.id
      ) {
        return [{ ...layer, item: { ...layer.item, space: null } }];
      }
      return [layer];
    }));
  }, [clearClose, updateLayers]);

  return {
    applyManagementUpdate,
    close,
    closeTop,
    layers,
    open,
    removeContent,
    updateMapEntry,
    updateSpace,
  };
}
