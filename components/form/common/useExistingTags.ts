import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { PlaceSummary } from '@/lib/map-content/types';
import { mapContentQueryOptions } from '@/lib/map-content/client';

const normalizeTag = (tag: string) => tag.trim();

const extractUniqueTags = (places: PlaceSummary[]) => {
  const unique = new Map<string, string>();
  for (const place of places) {
    for (const tag of place.tags ?? []) {
      const normalized = normalizeTag(tag);
      if (!normalized) continue;
      const key = normalized.toLowerCase();
      if (!unique.has(key)) {
        unique.set(key, normalized);
      }
    }
  }
  return Array.from(unique.values()).sort((a, b) => a.localeCompare(b, 'fr', { sensitivity: 'base' }));
};

export function useExistingTags() {
  const query = useQuery(mapContentQueryOptions);
  const suggestions = useMemo(
    () => extractUniqueTags(query.data?.places ?? []),
    [query.data?.places],
  );
  return { suggestions, loading: query.isPending };
}
