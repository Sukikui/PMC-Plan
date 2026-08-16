const POSTGRES_PROTOCOLS = new Set(['postgres:', 'postgresql:']);

export function createPrismaPgConfig(connectionString: string | undefined) {
  if (!connectionString) {
    throw new Error('DATABASE_URL is required to initialize Prisma.');
  }

  let url: URL;
  try {
    url = new URL(connectionString);
  } catch {
    throw new Error('DATABASE_URL must be a valid PostgreSQL URL.');
  }

  if (!POSTGRES_PROTOCOLS.has(url.protocol)) {
    throw new Error('DATABASE_URL must use the postgres or postgresql protocol.');
  }

  if (
    url.searchParams.get('sslmode') === 'require'
    && !url.searchParams.has('uselibpqcompat')
  ) {
    url.searchParams.set('uselibpqcompat', 'true');
    return { connectionString: url.toString() };
  }

  return { connectionString };
}
