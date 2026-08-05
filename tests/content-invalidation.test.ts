import { QueryClient } from '@tanstack/react-query';
import { subscribeToContentUpdates } from '@/lib/content/client-events';
import { invalidateContentQueries } from '@/lib/query/content-invalidation';
import { queryKeys } from '@/lib/query/keys';

describe('content query invalidation', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient();
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: new EventTarget(),
    });
  });

  afterEach(() => {
    queryClient.clear();
    Reflect.deleteProperty(globalThis, 'window');
  });

  it('invalidates only the public views affected by a place update', () => {
    seedQuery(queryClient, queryKeys.mapContent);
    seedQuery(queryClient, queryKeys.marketOffers(''));
    seedQuery(queryClient, queryKeys.serviceList('', 'all'));
    seedQuery(queryClient, queryKeys.spaceList(''));

    invalidateContentQueries(queryClient, { type: 'place' });

    expect(isInvalidated(queryClient, queryKeys.mapContent)).toBe(true);
    expect(isInvalidated(queryClient, queryKeys.marketOffers(''))).toBe(true);
    expect(isInvalidated(queryClient, queryKeys.spaceList(''))).toBe(true);
    expect(isInvalidated(queryClient, queryKeys.serviceList('', 'all'))).toBe(false);
  });

  it('keeps map data untouched after a service update', () => {
    seedQuery(queryClient, queryKeys.mapContent);
    seedQuery(queryClient, queryKeys.serviceList('', 'all'));
    const updates: string[] = [];
    const unsubscribe = subscribeToContentUpdates((type) => updates.push(type));

    invalidateContentQueries(queryClient, { type: 'service' });

    expect(isInvalidated(queryClient, queryKeys.mapContent)).toBe(false);
    expect(isInvalidated(queryClient, queryKeys.serviceList('', 'all'))).toBe(true);
    expect(updates).toEqual(['service']);
    unsubscribe();
  });
});

function seedQuery(queryClient: QueryClient, queryKey: readonly unknown[]) {
  queryClient.setQueryData(queryKey, { value: true });
}

function isInvalidated(queryClient: QueryClient, queryKey: readonly unknown[]) {
  return queryClient.getQueryState(queryKey)?.isInvalidated ?? false;
}
