import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { assertLocalDatabaseEnvironment } from './database/environment.mjs';

const isHostedBuild = process.env.CI === 'true' || process.env.VERCEL === '1';

if (!isHostedBuild) assertLocalDatabaseEnvironment();

const require = createRequire(import.meta.url);

runCli(require.resolve('prisma/build/index.js'), ['generate']);
runCli(require.resolve('next/dist/bin/next'), ['build']);

function runCli(entryPoint, args) {
  const result = spawnSync(process.execPath, [entryPoint, ...args], {
    env: process.env,
    stdio: 'inherit',
  });

  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
