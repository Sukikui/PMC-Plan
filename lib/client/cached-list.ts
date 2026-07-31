interface CachedListOptions<T> {
  eventName: string;
  load: () => Promise<T[]>;
}

export type InvalidationSubscription = (listener: () => void) => () => void;

export function createCachedList<T>({
  eventName,
  load,
}: CachedListOptions<T>) {
  let cache: T[] | null = null;
  let request: Promise<T[]> | null = null;
  let version = 0;

  const fetchAll = async (): Promise<T[]> => {
    if (cache) return cache;
    if (request) return request;

    const requestedVersion = version;
    const currentRequest = load()
      .then((items) => {
        if (version !== requestedVersion) return fetchAll();
        cache = items;
        return items;
      })
      .finally(() => {
        if (request === currentRequest) request = null;
      });
    request = currentRequest;
    return currentRequest;
  };

  const notify = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event(eventName));
    }
  };

  return {
    fetchAll,
    invalidate({ notify: shouldNotify = true } = {}) {
      version += 1;
      cache = null;
      request = null;
      if (shouldNotify) notify();
    },
    notify,
    update(updateItems: (items: T[]) => void) {
      if (cache) {
        updateItems(cache);
        return;
      }
      void request?.then((items) => updateItems(items));
    },
    subscribe(listener: () => void) {
      if (typeof window === 'undefined') return () => {};
      window.addEventListener(eventName, listener);
      return () => window.removeEventListener(eventName, listener);
    },
  };
}

export function subscribeToInvalidations(
  subscriptions: InvalidationSubscription[],
  listener: () => void,
) {
  let scheduled = false;
  const schedule = () => {
    if (scheduled) return;
    scheduled = true;
    queueMicrotask(() => {
      scheduled = false;
      listener();
    });
  };
  const unsubscribers = subscriptions.map((subscribe) => subscribe(schedule));
  return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
}
