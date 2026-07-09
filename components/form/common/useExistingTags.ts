import { useEffect, useMemo, useState } from 'react';
import type { Place } from '@/app/api/utils/shared';

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
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        const response = await fetch('/api/places');
        if (!response.ok) {
          throw new Error('Erreur de chargement des tags');
        }
        const data: Place[] = await response.json();
        if (!cancelled) {
          setTags(extractUniqueTags(data));
        }
      } catch {
        if (!cancelled) {
          setTags([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const suggestions = useMemo(() => tags, [tags]);

  return { suggestions, loading };
}
