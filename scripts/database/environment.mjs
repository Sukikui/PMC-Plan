const LOCAL_DATABASE_NAME = 'pmc_plan_dev';
const LOCAL_DATABASE_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]', '::1']);

export function assertLocalDatabaseEnvironment(environment = process.env) {
  assertLocalDatabaseUrl(environment.DATABASE_URL, 'DATABASE_URL');
  assertLocalDatabaseUrl(
    environment.POSTGRES_URL_NON_POOLING,
    'POSTGRES_URL_NON_POOLING',
  );
}

export function getLocalDatabaseUrl(environment = process.env) {
  assertLocalDatabaseEnvironment(environment);
  return environment.POSTGRES_URL_NON_POOLING;
}

export function assertRemoteSnapshotSource(value) {
  const url = parseDatabaseUrl(value, 'POSTGRES_URL_NON_POOLING');
  const databaseName = decodeURIComponent(url.pathname.replace(/^\//, ''));

  if (LOCAL_DATABASE_HOSTS.has(url.hostname) || databaseName === LOCAL_DATABASE_NAME) {
    throw new Error(
      'POSTGRES_URL_NON_POOLING must target the remote production database '
      + 'when publishing a development snapshot.',
    );
  }

  return url.toString();
}

function assertLocalDatabaseUrl(value, variableName) {
  const url = parseDatabaseUrl(value, variableName);

  const databaseName = decodeURIComponent(url.pathname.replace(/^\//, ''));
  if (!LOCAL_DATABASE_HOSTS.has(url.hostname) || databaseName !== LOCAL_DATABASE_NAME) {
    throw new Error(
      `${variableName} must target ${LOCAL_DATABASE_NAME} on localhost. `
      + 'Remote databases are blocked from local commands.',
    );
  }
}

function parseDatabaseUrl(value, variableName) {
  if (!value) {
    throw new Error(
      `${variableName} is missing. Create .env.development.local from `
      + '.env.development.example.',
    );
  }

  try {
    return new URL(value);
  } catch {
    throw new Error(`${variableName} must be a valid PostgreSQL URL.`);
  }
}
