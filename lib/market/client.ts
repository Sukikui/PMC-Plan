import {
  infiniteQueryOptions,
  keepPreviousData,
} from '@tanstack/react-query';
import type { PaginatedResponse } from '@/lib/api/pagination';
import { requestJson } from '@/lib/api-client';
import { queryKeys } from '@/lib/query/keys';
import type { GlobalOffer } from '@/lib/trade/global-offers';

export function marketOffersQueryOptions(query: string) {
  return infiniteQueryOptions({
    queryKey: queryKeys.marketOffers(query),
    initialPageParam: 1,
    placeholderData: keepPreviousData,
    queryFn: ({ pageParam, signal }) => requestJson<PaginatedResponse<GlobalOffer>>(
      `/api/market/offers?page=${pageParam}&q=${encodeURIComponent(query)}`,
      { signal },
      'Impossible de charger les offres.',
    ),
    getNextPageParam: (lastPage) => (
      lastPage.pagination.page < lastPage.pagination.totalPages
        ? lastPage.pagination.page + 1
        : undefined
    ),
  });
}
