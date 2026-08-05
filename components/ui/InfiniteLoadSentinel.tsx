'use client';

import { useEffect, useRef } from 'react';
import { themeColors } from '@/lib/theme-colors';

export default function InfiniteLoadSentinel({
  hasNextPage,
  loading,
  onLoadMore,
}: {
  hasNextPage: boolean;
  loading: boolean;
  onLoadMore: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element || !hasNextPage || loading) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) onLoadMore();
    }, { rootMargin: '160px' });
    observer.observe(element);
    return () => observer.disconnect();
  }, [hasNextPage, loading, onLoadMore]);

  if (!hasNextPage && !loading) return null;
  return (
    <div
      ref={ref}
      className={`py-4 text-center text-xs ${themeColors.text.tertiary}`}
    >
      {loading ? 'Chargement…' : ''}
    </div>
  );
}
