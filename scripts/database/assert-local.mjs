import { assertLocalDatabaseEnvironment } from './environment.mjs';

try {
  assertLocalDatabaseEnvironment();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
