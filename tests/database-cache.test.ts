import { revalidateTag, unstable_cache } from 'next/cache';
import {
  cacheDatabaseQuery,
  revalidateDatabaseCacheTag,
} from '@/lib/cache/database-cache';

jest.mock('next/cache', () => ({
  revalidateTag: jest.fn(),
  unstable_cache: jest.fn((callback) => callback),
}));

const unstableCacheMock = unstable_cache as jest.MockedFunction<typeof unstable_cache>;
const revalidateTagMock = revalidateTag as jest.MockedFunction<typeof revalidateTag>;
const originalNodeEnvironment = process.env.NODE_ENV;
const originalDatabaseUrl = process.env.DATABASE_URL;

afterEach(() => {
  setNodeEnvironment(originalNodeEnvironment);
  process.env.DATABASE_URL = originalDatabaseUrl;
  jest.clearAllMocks();
});

describe('database cache isolation', () => {
  it('bypasses persistent caching during local development', async () => {
    setEnvironment('development', localDatabaseUrl);
    const query = jest.fn(async (value: string) => `result:${value}`);

    const load = cacheDatabaseQuery(query, ['example'], {
      revalidate: 300,
      tags: ['content'],
    });

    await expect(load('local')).resolves.toBe('result:local');
    expect(load).toBe(query);
    expect(unstableCacheMock).not.toHaveBeenCalled();
  });

  it('uses distinct opaque scopes for different database identities', () => {
    setNodeEnvironment('production');
    process.env.DATABASE_URL = pooledDatabaseUrl('project-one', 'secret-one');
    cacheDatabaseQuery(async () => 'first', ['content'], { tags: ['map'] });
    const firstCall = unstableCacheMock.mock.calls[0];

    process.env.DATABASE_URL = pooledDatabaseUrl('project-two', 'secret-two');
    cacheDatabaseQuery(async () => 'second', ['content'], { tags: ['map'] });
    const secondCall = unstableCacheMock.mock.calls[1];

    expect(firstCall[1]?.slice(1)).toEqual(['content']);
    expect(secondCall[1]?.slice(1)).toEqual(['content']);
    expect(firstCall[1]?.[0]).not.toBe(secondCall[1]?.[0]);
    expect(firstCall[1]?.join(':')).not.toContain('secret-one');
    expect(firstCall[2]?.tags?.[0]).toMatch(/^database-[a-f0-9]{16}:map$/);
  });

  it('scopes invalidation tags outside development', () => {
    setEnvironment('production', localDatabaseUrl);

    revalidateDatabaseCacheTag('services');

    expect(revalidateTagMock).toHaveBeenCalledWith(
      expect.stringMatching(/^database-[a-f0-9]{16}:services$/),
      { expire: 0 },
    );
  });

  it('does not invalidate the persistent cache during development', () => {
    setEnvironment('development', localDatabaseUrl);

    revalidateDatabaseCacheTag('services');

    expect(revalidateTagMock).not.toHaveBeenCalled();
  });
});

const localDatabaseUrl = 'postgresql://pmc_plan:pmc_plan@localhost:5432/pmc_plan_dev';

function setEnvironment(nodeEnvironment: string, databaseUrl: string) {
  setNodeEnvironment(nodeEnvironment);
  process.env.DATABASE_URL = databaseUrl;
}

function setNodeEnvironment(value: string | undefined) {
  Object.defineProperty(process.env, 'NODE_ENV', {
    configurable: true,
    enumerable: true,
    value,
    writable: true,
  });
}

function pooledDatabaseUrl(project: string, password: string) {
  return `postgresql://postgres.${project}:${password}`
    + '@aws-1-eu-west-3.pooler.supabase.com:6543/postgres';
}
