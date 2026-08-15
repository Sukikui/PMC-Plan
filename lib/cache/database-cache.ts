import { createHash } from 'node:crypto';
import { revalidateTag, unstable_cache } from 'next/cache';

type AsyncCallback<TArgs extends unknown[], TResult> = (
  ...args: TArgs
) => Promise<TResult>;

interface DatabaseCacheOptions {
  revalidate?: number | false;
  tags?: string[];
}

export function cacheDatabaseQuery<TArgs extends unknown[], TResult>(
  callback: AsyncCallback<TArgs, TResult>,
  keyParts: string[],
  options?: DatabaseCacheOptions,
): AsyncCallback<TArgs, TResult> {
  if (process.env.NODE_ENV === 'development') return callback;

  return unstable_cache(
    callback,
    [databaseCacheScope(), ...keyParts],
    {
      ...options,
      tags: options?.tags?.map(scopeDatabaseCacheTag),
    },
  );
}

export function revalidateDatabaseCacheTag(tag: string) {
  if (process.env.NODE_ENV === 'development') return;
  revalidateTag(scopeDatabaseCacheTag(tag), { expire: 0 });
}

function scopeDatabaseCacheTag(tag: string) {
  return `${databaseCacheScope()}:${tag}`;
}

function databaseCacheScope() {
  const identity = getDatabaseIdentity(process.env.DATABASE_URL);
  const digest = createHash('sha256').update(identity).digest('hex').slice(0, 16);
  return `database-${digest}`;
}

function getDatabaseIdentity(value?: string) {
  if (!value) return 'unconfigured';

  try {
    const url = new URL(value);
    const schema = url.searchParams.get('schema') ?? 'public';
    return [url.username, url.hostname, url.port, url.pathname, schema].join('|');
  } catch {
    return 'invalid';
  }
}
