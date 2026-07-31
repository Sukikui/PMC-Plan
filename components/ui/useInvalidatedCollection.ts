'use client';

import { useEffect, useState } from 'react';

interface InvalidatedCollectionOptions<T> {
  enabled?: boolean;
  errorMessage: string;
  loadItems: () => Promise<T[]>;
  subscribe: (listener: () => void) => () => void;
}

export function useInvalidatedCollection<T>({
  enabled = true,
  errorMessage,
  loadItems,
  subscribe,
}: InvalidatedCollectionOptions<T>) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    const load = async (showLoading = true) => {
      if (showLoading) setLoading(true);
      setError(null);

      try {
        const nextItems = await loadItems();
        if (!cancelled) setItems(nextItems);
      } catch (requestError) {
        if (!cancelled) {
          setError(requestError instanceof Error
            ? requestError.message
            : errorMessage);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    const unsubscribe = subscribe(() => {
      void load(false);
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [enabled, errorMessage, loadItems, subscribe]);

  return { error, items, loading };
}
