'use client';

import { useEffect, useState } from 'react';
import { MANAGEMENT_LIST_PAGE_SIZE } from '@/lib/management/pagination';

export interface ManagementPagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface ManagementPageData<T> {
  items: T[];
  pagination: ManagementPagination;
}

interface PaginatedManagementQueryOptions<T> {
  load: (
    page: number,
    query: string,
    signal: AbortSignal,
  ) => Promise<ManagementPageData<T>>;
  refreshKey?: string;
}

const emptyPagination: ManagementPagination = {
  page: 1,
  pageSize: MANAGEMENT_LIST_PAGE_SIZE,
  total: 0,
  totalPages: 1,
};

export default function usePaginatedManagementQuery<T>({
  load,
  refreshKey = '',
}: PaginatedManagementQueryOptions<T>) {
  const [query, setQueryValue] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<ManagementPageData<T>>({
    items: [],
    pagination: emptyPagination,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        setData(await load(page, query, controller.signal));
      } catch (requestError) {
        if (!controller.signal.aborted) {
          setError(requestError instanceof Error
            ? requestError.message
            : 'Erreur inconnue.');
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 250);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [load, page, query, refreshKey]);

  const setQuery = (value: string) => {
    setQueryValue(value);
    setPage(1);
  };

  return {
    data,
    error,
    loading,
    page,
    query,
    setData,
    setError,
    setPage,
    setQuery,
  };
}
