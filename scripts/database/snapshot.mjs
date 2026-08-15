import { createReadStream, createWriteStream } from 'node:fs';
import { mkdir, open, readFile, readdir, rename, stat, unlink } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';
import { spawn } from 'node:child_process';
import {
  assertLocalDatabaseEnvironment,
  assertRemoteSnapshotSource,
  getLocalDatabaseUrl,
} from './environment.mjs';

const snapshotDirectory = path.resolve('.local/database');
const snapshotPath = path.join(snapshotDirectory, 'development-baseline.dump');
const command = process.argv[2];

try {
  if (command === 'pull') await pullSnapshot();
  else if (command === 'restore') await restoreSnapshot();
  else if (command === 'publish') await publishSnapshot();
  else throw new Error('Expected snapshot command: pull, restore, or publish.');
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}

async function pullSnapshot() {
  assertLocalDatabaseEnvironment();
  const sourceUrl = requireEnvironment('DEV_DATABASE_SNAPSHOT_URL');
  const partialPath = `${snapshotPath}.partial`;
  await mkdir(snapshotDirectory, { recursive: true });

  try {
    const url = new URL(sourceUrl);
    url.searchParams.set('cacheNonce', Date.now().toString());
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok || !response.body) {
      throw new Error(`Snapshot download failed with HTTP ${response.status}.`);
    }

    await pipeline(Readable.fromWeb(response.body), createWriteStream(partialPath));
    await assertValidArchive(partialPath);
    await rename(partialPath, snapshotPath);
    console.log(`Development snapshot downloaded to ${snapshotPath}.`);
  } catch (error) {
    await unlink(partialPath).catch(() => undefined);
    throw error;
  }
}

async function restoreSnapshot() {
  const localDatabaseUrl = getLocalDatabaseUrl();
  await assertSnapshotExists();
  await assertDatabaseContainerRunning();

  const databaseUrl = new URL(localDatabaseUrl);
  const databaseName = decodeURIComponent(databaseUrl.pathname.slice(1));
  const databaseOwner = decodeURIComponent(databaseUrl.username);
  const maintenanceUrl = new URL(databaseUrl);
  maintenanceUrl.pathname = '/postgres';

  await run('docker', [
    'compose', 'exec', '-T',
    'database', 'dropdb',
    '--maintenance-db', maintenanceUrl.toString(),
    '--force', '--if-exists', databaseName,
  ]);
  await run('docker', [
    'compose', 'exec', '-T',
    'database', 'createdb',
    '--maintenance-db', maintenanceUrl.toString(),
    '--owner', databaseOwner, databaseName,
  ]);
  await run('docker', [
    'compose', 'exec', '-T',
    'database', 'psql', localDatabaseUrl,
    '--set', 'ON_ERROR_STOP=1',
    '--command', 'DROP SCHEMA public CASCADE;',
  ]);

  await run('docker', [
    'compose', 'exec', '-T',
    '-e', 'LOCAL_DATABASE_URL',
    'database', 'sh', '-c',
    'exec pg_restore --dbname "$LOCAL_DATABASE_URL" '
      + '--exit-on-error --no-owner --no-privileges',
  ], {
    env: { ...process.env, LOCAL_DATABASE_URL: localDatabaseUrl },
    input: createReadStream(snapshotPath),
  });

  await ensureMigrationBaseline(localDatabaseUrl);
  console.log('Local database restored from the development snapshot.');
}

async function publishSnapshot() {
  const sourceUrl = assertRemoteSnapshotSource(process.env.POSTGRES_URL_NON_POOLING);
  const supabaseUrl = requireEnvironment('SUPABASE_URL').replace(/\/$/, '');
  const serviceKey = requireEnvironment('SUPABASE_SERVICE_ROLE_KEY');
  const bucket = process.env.DATABASE_SNAPSHOT_BUCKET || 'development-snapshots';
  const objectPath = process.env.DATABASE_SNAPSHOT_OBJECT
    || 'pmc-plan/development-baseline.dump';
  const temporaryPath = path.join(snapshotDirectory, 'published-baseline.dump');
  await mkdir(snapshotDirectory, { recursive: true });

  try {
    await ensurePrivateBucket(supabaseUrl, serviceKey, bucket);
    const archive = await open(temporaryPath, 'w');
    try {
      await run('docker', [
        'compose', 'run', '--rm', '--no-deps', '-T',
        '-e', 'SNAPSHOT_SOURCE_URL',
        'database', 'sh', '-c',
        'exec pg_dump "$SNAPSHOT_SOURCE_URL" --schema public --format custom '
          + '--no-owner --no-privileges '
          + '--exclude-table-data=public.minecraft_link_requests',
      ], {
        env: { ...process.env, SNAPSHOT_SOURCE_URL: sourceUrl },
        output: archive.fd,
      });
    } finally {
      await archive.close();
    }

    await assertValidArchive(temporaryPath);
    await uploadSnapshot(supabaseUrl, serviceKey, bucket, objectPath, temporaryPath);
    const signedUrl = await createSignedUrl(
      supabaseUrl,
      serviceKey,
      bucket,
      objectPath,
    );

    console.log('Development snapshot published. Share only this signed URL:');
    console.log(`DEV_DATABASE_SNAPSHOT_URL=${signedUrl}`);
  } finally {
    await unlink(temporaryPath).catch(() => undefined);
  }
}

async function ensureMigrationBaseline(localDatabaseUrl) {
  const baseline = (await readdir(path.resolve('prisma/migrations'), {
    withFileTypes: true,
  }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()[0];

  if (!baseline) throw new Error('No Prisma migration baseline was found.');
  const tableExists = await queryLocalDatabase(
    localDatabaseUrl,
    "SELECT to_regclass('public._prisma_migrations') IS NOT NULL;",
  );
  if (tableExists === 't') {
    const escapedBaseline = baseline.replaceAll("'", "''");
    const applied = await queryLocalDatabase(
      localDatabaseUrl,
      `SELECT EXISTS (SELECT 1 FROM "_prisma_migrations" WHERE "migration_name" = '${escapedBaseline}');`,
    );
    if (applied === 't') return;
  }

  const require = createRequire(import.meta.url);
  const prismaCli = require.resolve('prisma/build/index.js');
  await run(process.execPath, [
    prismaCli,
    'migrate', 'resolve', '--applied', baseline,
  ], { env: process.env });
}

async function queryLocalDatabase(databaseUrl, sql) {
  return (await run('docker', [
    'compose', 'exec', '-T',
    '-e', 'LOCAL_DATABASE_URL',
    '-e', 'QUERY_SQL',
    'database', 'sh', '-c',
    'exec psql "$LOCAL_DATABASE_URL" --tuples-only --no-align --command "$QUERY_SQL"',
  ], {
    capture: true,
    env: { ...process.env, LOCAL_DATABASE_URL: databaseUrl, QUERY_SQL: sql },
  })).trim();
}

async function assertValidArchive(filePath) {
  await run('docker', [
    'compose', 'run', '--rm', '--no-deps', '-T',
    'database', 'pg_restore', '--list',
  ], { input: createReadStream(filePath), silent: true });
}

async function assertSnapshotExists() {
  const details = await stat(snapshotPath).catch(() => null);
  if (!details?.isFile() || details.size === 0) {
    throw new Error('No local snapshot found. Run npm run db:pull first.');
  }
}

async function assertDatabaseContainerRunning() {
  const serviceId = (await run(
    'docker',
    ['compose', 'ps', '--status', 'running', '--quiet', 'database'],
    { capture: true },
  )).trim();
  if (!serviceId) throw new Error('The local database is stopped. Run npm run db:start.');
}

async function ensurePrivateBucket(baseUrl, key, bucket) {
  const bucketUrl = `${baseUrl}/storage/v1/bucket/${encodeURIComponent(bucket)}`;
  const response = await fetch(bucketUrl, { headers: storageHeaders(key) });
  if (response.ok) {
    const current = await response.json();
    if (current.public) throw new Error(`Storage bucket ${bucket} must be private.`);
    return;
  }
  const details = await response.text();
  if (!isMissingBucket(response.status, details)) {
    throw storageError(response.status, details, 'Bucket lookup');
  }

  const created = await fetch(`${baseUrl}/storage/v1/bucket`, {
    method: 'POST',
    headers: { ...storageHeaders(key), 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: bucket, name: bucket, public: false }),
  });
  if (!created.ok) throw await responseError(created, 'Bucket creation');
}

async function uploadSnapshot(baseUrl, key, bucket, objectPath, filePath) {
  const response = await fetch(storageObjectUrl(baseUrl, bucket, objectPath), {
    method: 'POST',
    headers: {
      ...storageHeaders(key),
      'Content-Type': 'application/octet-stream',
      'x-upsert': 'true',
    },
    body: await readFile(filePath),
  });
  if (!response.ok) throw await responseError(response, 'Snapshot upload');
}

async function createSignedUrl(baseUrl, key, bucket, objectPath) {
  const expiresIn = Number(process.env.DATABASE_SNAPSHOT_URL_TTL_SECONDS)
    || 31_536_000;
  const response = await fetch(
    `${baseUrl}/storage/v1/object/sign/${objectKey(bucket, objectPath)}`,
    {
      method: 'POST',
      headers: { ...storageHeaders(key), 'Content-Type': 'application/json' },
      body: JSON.stringify({ expiresIn }),
    },
  );
  if (!response.ok) throw await responseError(response, 'Signed URL creation');
  const result = await response.json();
  const signedPath = result.signedURL ?? result.signedUrl;
  if (!signedPath) throw new Error('Supabase did not return a signed URL.');
  if (/^https?:\/\//.test(signedPath)) return signedPath;
  return `${baseUrl}/storage/v1${signedPath.startsWith('/') ? '' : '/'}${signedPath}`;
}

function storageObjectUrl(baseUrl, bucket, objectPath) {
  return `${baseUrl}/storage/v1/object/${objectKey(bucket, objectPath)}`;
}

function objectKey(bucket, objectPath) {
  return [bucket, ...objectPath.split('/')].map(encodeURIComponent).join('/');
}

function storageHeaders(key) {
  return { apikey: key, Authorization: `Bearer ${key}` };
}

async function responseError(response, operation) {
  const details = await response.text();
  return storageError(response.status, details, operation);
}

function storageError(status, details, operation) {
  return new Error(`${operation} failed with HTTP ${status}: ${details}`);
}

function isMissingBucket(status, details) {
  if (status === 404) return true;
  try {
    const payload = JSON.parse(details);
    return payload.statusCode === '404' || payload.code === 'NoSuchBucket';
  } catch {
    return false;
  }
}

function requireEnvironment(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is missing.`);
  return value;
}

function run(executable, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(executable, args, {
      cwd: process.cwd(),
      env: options.env ?? process.env,
      stdio: [options.input ? 'pipe' : 'ignore', options.capture ? 'pipe' : (options.output ?? (options.silent ? 'ignore' : 'inherit')), options.silent ? 'ignore' : 'inherit'],
    });
    let output = '';
    if (options.capture) child.stdout.setEncoding('utf8').on('data', (chunk) => { output += chunk; });
    if (options.input) options.input.pipe(child.stdin);
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) resolve(output);
      else reject(new Error(`${executable} exited with status ${code}.`));
    });
  });
}
