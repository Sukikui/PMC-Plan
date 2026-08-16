import { createPrismaPgConfig } from '@/lib/prisma/connection';

describe('Prisma PostgreSQL connection configuration', () => {
  it('keeps local database URLs unchanged', () => {
    const connectionString = 'postgresql://pmc_plan:pmc_plan@localhost:5432/pmc_plan_dev';

    expect(createPrismaPgConfig(connectionString)).toEqual({ connectionString });
  });

  it('preserves libpq require semantics for pg-based remote connections', () => {
    const config = createPrismaPgConfig(
      'postgresql://user:password@pooler.example.com:6543/postgres?sslmode=require',
    );
    const url = new URL(config.connectionString);

    expect(url.searchParams.get('sslmode')).toBe('require');
    expect(url.searchParams.get('uselibpqcompat')).toBe('true');
  });

  it('rejects a missing runtime database URL', () => {
    expect(() => createPrismaPgConfig(undefined)).toThrow(
      'DATABASE_URL is required to initialize Prisma.',
    );
  });
});
