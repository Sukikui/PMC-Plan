# Database Deployment

Database migrations are developed and verified locally and in CI before being
applied to production. The project does not maintain a staging database, and
`prisma db push` is not part of the workflow.

## Existing Production Baseline

The `20260811000000_baseline` migration represents the production schema that
existed when Prisma Migrate was introduced. The live database already contains
these tables, indexes, and constraints, so the baseline SQL must not be executed
against it.

Before the first production `prisma migrate deploy`:

1. create a fresh database backup;
2. confirm that the live schema still matches `schema.prisma` with
   `prisma migrate diff`;
3. mark `20260811000000_baseline` as applied with `prisma migrate resolve`;
4. inspect `prisma migrate status` before deploying any later migration.

These commands modify migration history and must be run only by the project
owner with explicit production credentials. They are intentionally not exposed
as npm scripts.

## Production

Only committed migrations may change the production schema. For this small
project, the project owner applies pending migrations manually with
`prisma migrate deploy` from a controlled environment after the PR passes CI
and immediately before deploying the corresponding application version.

Production deployment credentials must not be distributed to contributors or
stored in `.env.development.local`. Application deployments and schema
deployments remain separate operations so migration failures cannot silently
occur during a Vercel build. Vercel Preview deployments are not connected to
the production database.

The regular release flow is therefore:

1. develop and test against the local resettable database;
2. open a pull request and wait for CI;
3. merge the reviewed changes;
4. back up production and apply committed migrations when the schema changed;
5. deploy the application to Vercel Production.
