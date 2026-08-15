import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const localUrl = 'postgresql://pmc_plan:pmc_plan@localhost:5432/pmc_plan_dev';
const guardScript = path.resolve('scripts/database/assert-local.mjs');
const snapshotScript = path.resolve('scripts/database/snapshot.mjs');
const commonEnvironmentVariables = [
  'NEXT_PUBLIC_BETA_PASSWORD',
  'NEXT_PUBLIC_DISABLE_BETA_LOCK',
  'MINECRAFT_VERSION',
  'AUTH_URL',
  'AUTH_SECRET',
  'DISCORD_CLIENT_ID',
  'DISCORD_CLIENT_SECRET',
  'DATABASE_URL',
  'POSTGRES_URL_NON_POOLING',
  'MINEVERIFY_TOKEN',
];

const readEnvironmentVariables = (file: string) => (
  readFileSync(file, 'utf8')
    .match(/^[A-Z][A-Z0-9_]*(?==)/gm) ?? []
);

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
  it('uses one complete contributor environment file for local scripts', () => {
    const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as {
      scripts: Record<string, string>;
    };
    const contributorScripts = [
      'dev',
      'build',
      'db:generate',
      'db:apply',
      'db:check',
      'db:migrate',
      'db:pull',
      'db:reset',
      'db:bootstrap',
      'db:verify',
      'db:studio',
    ];

    for (const script of contributorScripts) {
      expect(packageJson.scripts[script]).toContain('.env.development.local');
      expect(packageJson.scripts[script]).not.toContain('-e .env.local ');
    }
    expect(packageJson.scripts['db:snapshot:publish']).toContain('-e .env.local ');
  });

  it('provides every contributor variable in the development example', () => {
    const example = readFileSync('.env.development.local.example', 'utf8');
    const variables = [
      'NEXT_PUBLIC_BETA_PASSWORD',
      'NEXT_PUBLIC_DISABLE_BETA_LOCK',
      'MINECRAFT_VERSION',
      'AUTH_URL',
      'AUTH_SECRET',
      'DISCORD_CLIENT_ID',
      'DISCORD_CLIENT_SECRET',
      'DATABASE_URL',
      'POSTGRES_URL_NON_POOLING',
      'DEV_DATABASE_SNAPSHOT_URL',
      'MINEVERIFY_TOKEN',
      'DEV_DISCORD_ID',
    ];

    for (const variable of variables) {
      expect(example).toMatch(new RegExp(`^${variable}=`, 'm'));
    }
    expect(example).not.toContain('SUPABASE_SERVICE_ROLE_KEY');
  });

  it('keeps shared production and development variables in the same order', () => {
    for (const file of ['.env.local.example', '.env.development.local.example']) {
      const sharedVariables = readEnvironmentVariables(file)
        .filter((variable) => commonEnvironmentVariables.includes(variable));

      expect(sharedVariables).toEqual(commonEnvironmentVariables);
    }
  });

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
