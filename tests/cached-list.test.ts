import {
  createCachedList,
  subscribeToInvalidations,
  type InvalidationSubscription,
} from '@/lib/client/cached-list';

describe('cached list', () => {
  it('deduplicates concurrent loads and reuses the cached value', async () => {
    const load = jest.fn(async () => [{ id: 'place-1' }]);
    const list = createCachedList({ eventName: 'test:list', load });

    const [firstResult, secondResult] = await Promise.all([
      list.fetchAll(),
      list.fetchAll(),
    ]);

    expect(firstResult).toEqual([{ id: 'place-1' }]);
    expect(secondResult).toBe(firstResult);
    await expect(list.fetchAll()).resolves.toBe(firstResult);
    expect(load).toHaveBeenCalledTimes(1);
  });

  it('updates cached items without triggering another request', async () => {
    const load = jest.fn(async () => [{ id: 'place-1', name: 'Before' }]);
    const list = createCachedList({ eventName: 'test:list', load });
    await list.fetchAll();

    list.update((items) => {
      items[0].name = 'After';
    });

    await expect(list.fetchAll()).resolves.toEqual([
      { id: 'place-1', name: 'After' },
    ]);
    expect(load).toHaveBeenCalledTimes(1);
  });
});

describe('invalidation subscriptions', () => {
  it('coalesces synchronous invalidations and unsubscribes every source', async () => {
    const first = createSubscription();
    const second = createSubscription();
    const listener = jest.fn();
    const unsubscribe = subscribeToInvalidations(
      [first.subscribe, second.subscribe],
      listener,
    );

    first.invalidate();
    second.invalidate();
    expect(listener).not.toHaveBeenCalled();
    await Promise.resolve();
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
    first.invalidate();
    second.invalidate();
    await Promise.resolve();
    expect(listener).toHaveBeenCalledTimes(1);
  });
});

function createSubscription() {
  const listeners = new Set<() => void>();
  const subscribe: InvalidationSubscription = (listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };

  return {
    invalidate: () => listeners.forEach((listener) => listener()),
    subscribe,
  };
}
