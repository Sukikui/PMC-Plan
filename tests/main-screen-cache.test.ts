import {
  invalidateMainScreenDataCaches,
  loadPlacesData,
} from '@/lib/preload/main-screen';

describe('main screen cache', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    invalidateMainScreenDataCaches();
  });

  it('never lets an invalidated request restore stale place data', async () => {
    const staleResponse = deferred<Response>();
    const freshResponse = deferred<Response>();
    const fetchMock = jest.fn()
      .mockReturnValueOnce(staleResponse.promise)
      .mockReturnValueOnce(freshResponse.promise);
    global.fetch = fetchMock;

    const staleLoad = loadPlacesData();
    invalidateMainScreenDataCaches();
    const freshLoad = loadPlacesData();

    freshResponse.resolve(jsonResponse([{ id: 'fresh-place' }]));
    await expect(freshLoad).resolves.toEqual([{ id: 'fresh-place' }]);

    staleResponse.resolve(jsonResponse([{ id: 'stale-place' }]));
    await expect(staleLoad).resolves.toEqual([{ id: 'fresh-place' }]);
    await expect(loadPlacesData()).resolves.toEqual([{ id: 'fresh-place' }]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((promiseResolve) => {
    resolve = promiseResolve;
  });
  return { promise, resolve };
}

function jsonResponse(payload: unknown) {
  return {
    ok: true,
    json: async () => payload,
  } as Response;
}
