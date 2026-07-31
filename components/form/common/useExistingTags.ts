import { useMemo } from 'react';
import type { Place } from '@/lib/api/types';
import { useInvalidatedCollection } from '@/components/ui/useInvalidatedCollection';
import {
  loadPlacesData,
  subscribeToMainScreenDataInvalidation,
} from '@/lib/preload/main-screen';

const normalizeTag = (tag: string) => tag.trim();

const extractUniqueTags = (places: Place[]) => {
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
  const { items, loading } = useInvalidatedCollection({
    errorMessage: 'Impossible de charger les tags.',
    loadItems: loadPlacesData,
    subscribe: subscribeToMainScreenDataInvalidation,
  });
  const suggestions = useMemo(() => extractUniqueTags(items), [items]);
  return { suggestions, loading };
}
