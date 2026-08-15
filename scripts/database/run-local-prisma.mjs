import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { assertLocalDatabaseEnvironment } from './environment.mjs';

assertLocalDatabaseEnvironment();

const require = createRequire(import.meta.url);
const prismaCli = require.resolve('prisma/build/index.js');
const result = spawnSync(
  process.execPath,
  [prismaCli, ...process.argv.slice(2)],
  { env: process.env, stdio: 'inherit' },
);

if (result.error) throw result.error;
process.exit(result.status ?? 1);
