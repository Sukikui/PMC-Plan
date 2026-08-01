import { useEffect, useMemo, useState } from 'react';
import type { MapMetadata } from '@/lib/map/metadata';
import { MAP_TILE_FADE_DURATION_MS } from '../core/map-constants';
import { getMapDrawRect } from '../core/map-geometry';
import { getVisibleMapTiles, type MapTileDescriptor } from '../core/map-tiles';
import { clamp, type MapPan, type MapSize, type MapViewport } from '../core/map-view';

export interface LoadedMapTile extends MapTileDescriptor {
  image: HTMLImageElement;
  opacity: number;
}

interface MapTileCacheEntry {
  image: HTMLImageElement | null;
  loadedAt: number | null;
  lastUsedAt: number;
  failed: boolean;
  loadListeners: Set<() => void>;
}

interface UseMapTilesOptions {
  metadata: MapMetadata;
  viewport: MapViewport;
  baseSize: MapSize;
  zoom: number;
  pan: MapPan;
  enabled: boolean;
}

const tileCache = new Map<string, MapTileCacheEntry>();
const MAX_CACHED_MAP_TILES = 64;

export const useMapTiles = ({
  metadata,
  viewport,
  baseSize,
  zoom,
  pan,
  enabled,
}: UseMapTilesOptions) => {
  const [cacheRevision, setCacheRevision] = useState(0);
  const [animationTime, setAnimationTime] = useState(() => (
    typeof performance === 'undefined' ? 0 : performance.now()
  ));
  const visibleTiles = useMemo(() => {
    if (!enabled || !metadata.tiles) {
      return [];
    }

    return getVisibleMapTiles(
      metadata.tiles,
      viewport,
      getMapDrawRect(viewport, baseSize, zoom, pan)
    );
  }, [baseSize, enabled, metadata.tiles, pan, viewport, zoom]);

  useEffect(() => {
    const visibleSources = new Set(visibleTiles.map((tile) => tile.src));
    const handleTileLoaded = () => {
      setCacheRevision((revision) => revision + 1);
    };
    const entries = visibleTiles.map((tile) => loadMapTile(tile));

    entries.forEach((entry) => {
      if (!entry.image && !entry.failed) {
        entry.loadListeners.add(handleTileLoaded);
      }
    });
    pruneMapTileCache(visibleSources);

    return () => {
      entries.forEach((entry) => entry.loadListeners.delete(handleTileLoaded));
    };
  }, [visibleTiles]);

  useEffect(() => {
    const now = performance.now();
    const entries = visibleTiles
      .map((tile) => tileCache.get(tile.src))
      .filter((entry): entry is MapTileCacheEntry => (
        entry?.loadedAt !== null
        && entry?.loadedAt !== undefined
        && now - entry.loadedAt < MAP_TILE_FADE_DURATION_MS
      ));

    if (entries.length === 0) {
      return;
    }

    let frameId: number | null = null;
    const updateAnimation = () => {
      const now = performance.now();
      setAnimationTime(now);

      if (entries.some((entry) => now - entry.loadedAt! < MAP_TILE_FADE_DURATION_MS)) {
        frameId = requestAnimationFrame(updateAnimation);
      }
    };

    frameId = requestAnimationFrame(updateAnimation);
    return () => {
      if (frameId !== null) {
        cancelAnimationFrame(frameId);
      }
    };
  }, [cacheRevision, visibleTiles]);

  return useMemo(() => {
    // Cache entries mutate when their image finishes loading.
    void cacheRevision;
    return visibleTiles.flatMap((tile): LoadedMapTile[] => {
      const entry = tileCache.get(tile.src);
      if (!entry?.image || entry.loadedAt === null || entry.failed) return [];

      return [{
        ...tile,
        image: entry.image,
        opacity: clamp((animationTime - entry.loadedAt) / MAP_TILE_FADE_DURATION_MS, 0, 1),
      }];
    });
  }, [animationTime, cacheRevision, visibleTiles]);
};

const loadMapTile = (tile: MapTileDescriptor) => {
  const cached = tileCache.get(tile.src);
  if (cached) {
    cached.lastUsedAt = performance.now();
    return cached;
  }

  const image = new Image();
  const entry: MapTileCacheEntry = {
    image: null,
    loadedAt: null,
    lastUsedAt: performance.now(),
    failed: false,
    loadListeners: new Set(),
  };

  image.onload = () => {
    if (image.naturalWidth !== tile.width || image.naturalHeight !== tile.height) {
      entry.failed = true;
      entry.loadListeners.clear();
      return;
    }

    entry.image = image;
    entry.loadedAt = performance.now();
    entry.lastUsedAt = entry.loadedAt;
    entry.loadListeners.forEach((listener) => listener());
    entry.loadListeners.clear();
  };
  image.onerror = () => {
    entry.failed = true;
    entry.loadListeners.clear();
  };
  image.src = tile.src;

  tileCache.set(tile.src, entry);
  return entry;
};

const pruneMapTileCache = (protectedSources: Set<string>) => {
  if (tileCache.size <= MAX_CACHED_MAP_TILES) {
    return;
  }

  const removableEntries = Array.from(tileCache.entries())
    .filter(([src]) => !protectedSources.has(src))
    .sort(([, first], [, second]) => first.lastUsedAt - second.lastUsedAt);

  for (const [src] of removableEntries) {
    if (tileCache.size <= MAX_CACHED_MAP_TILES) {
      break;
    }
    tileCache.delete(src);
  }
};
