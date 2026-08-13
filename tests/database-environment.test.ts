import { spawnSync } from 'node:child_process';
import path from 'node:path';

const localUrl = 'postgresql://pmc_plan:pmc_plan@localhost:5432/pmc_plan_dev';
const guardScript = path.resolve('scripts/database/assert-local.mjs');
const snapshotScript = path.resolve('scripts/database/snapshot.mjs');

const runGuard = (environment: NodeJS.ProcessEnv) => spawnSync(
  process.execPath,
  [guardScript],
  { encoding: 'utf8', env: environment },
);

const runSnapshot = (command: 'pull' | 'publish', environment: NodeJS.ProcessEnv) => (
  spawnSync(
    process.execPath,
    [snapshotScript, command],
    { encoding: 'utf8', env: environment },
  )
);

const baseEnvironment = () => {
  const {
    DATABASE_URL: _databaseUrl,
    POSTGRES_URL_NON_POOLING: _directUrl,
    DEV_DATABASE_SNAPSHOT_URL: _snapshotUrl,
    SUPABASE_URL: _supabaseUrl,
    SUPABASE_SERVICE_ROLE_KEY: _serviceRoleKey,
    ...environment
  } = process.env;
  return environment;
};

describe('local database safety', () => {
  it('accepts the isolated local development database', () => {
    const result = runGuard({
      ...baseEnvironment(),
      DATABASE_URL: localUrl,
      POSTGRES_URL_NON_POOLING: localUrl,
    });

    expect(result.status).toBe(0);
  });

  it('rejects remote PostgreSQL hosts', () => {
    const result = runGuard({
      ...baseEnvironment(),
      DATABASE_URL: 'postgresql://user:password@database.example.com:5432/pmc_plan_dev',
      POSTGRES_URL_NON_POOLING: localUrl,
    });

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('Remote databases are blocked');
  });

  it('rejects a non-development database on localhost', () => {
    const result = runGuard({
      ...baseEnvironment(),
      DATABASE_URL: 'postgresql://user:password@localhost:5432/postgres',
      POSTGRES_URL_NON_POOLING: localUrl,
    });

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('must target pmc_plan_dev');
  });

  it('requires both Prisma connection URLs', () => {
    const result = runGuard({
      ...baseEnvironment(),
      DATABASE_URL: localUrl,
    });

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('POSTGRES_URL_NON_POOLING is missing');
  });

  it('requires a signed URL before pulling a snapshot', () => {
    const result = runSnapshot('pull', {
      ...baseEnvironment(),
      DATABASE_URL: localUrl,
      POSTGRES_URL_NON_POOLING: localUrl,
    });

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('DEV_DATABASE_SNAPSHOT_URL is missing');
  });

  it('rejects a local database as a publication source', () => {
    const result = runSnapshot('publish', {
      ...baseEnvironment(),
      POSTGRES_URL_NON_POOLING: localUrl,
    });

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('remote production database');
  });
});
