# Local Development

PMC Plan uses an isolated PostgreSQL database for local development. Local
commands must never connect to the production database.

The application still reads shared non-database configuration from
`.env.local`. Local database credentials, the private snapshot URL, the
MineVerify development token, and the developer identity live in
`.env.development.local`, so local setup never overwrites deployed
configuration.

## Prerequisites

- Node.js 24 LTS and npm;
- Docker Engine, Docker Desktop, or another Docker-compatible runtime;
- the existing `.env.local` application configuration;
- a private signed snapshot URL supplied by a maintainer;
- the Discord user ID of the developer.

## First-Time Setup

On macOS with Homebrew, install and activate the required Node.js release:

```bash
brew install node@24
echo 'export PATH="/opt/homebrew/opt/node@24/bin:$PATH"' >> ~/.zshrc
exec zsh
```

Create the local database override without replacing `.env.local`:

```bash
cp .env.development.example .env.development.local
```

Set `DEV_DATABASE_SNAPSHOT_URL` to the signed URL supplied by a maintainer and
`DEV_DISCORD_ID` to the numeric Discord ID used for local sign-in. Then
initialize the environment:

```bash
npm install
npm run dev:setup
npm run dev
```

`dev:setup` starts PostgreSQL, generates Prisma Client, downloads the private
development baseline, restores it into `pmc_plan_dev`, applies migrations that
are newer than the snapshot, and bootstraps the local developer identity.

The downloaded archive lives at
`.local/database/development-baseline.dump`. It is ignored by Git and is reused
for offline resets. It contains production-derived community and account data;
do not copy it into the repository or distribute it outside the contributor
team.

## Development Identity

After every restoration, the bootstrap promotes the account matching
`DEV_DISCORD_ID` to local Super Admin. If the account is absent from the
snapshot, a placeholder identity is created and the regular Discord OAuth flow
updates it when the developer signs in. No authentication bypass is used.

The same Discord account can have unrelated roles in the local and production
databases. The existing debug mode can be used locally to exercise User, Admin,
and Super Admin permissions against the real authorization code.

## Testing MineVerify Locally

MineVerify can be tested end to end against the local application and database.
Each developer must use a dedicated token so local Paper servers never receive
the production MineVerify credential.

Generate a token:

```bash
openssl rand -base64 32
```

Store it in `.env.development.local`:

```env
MINEVERIFY_TOKEN=generated-token
```

Install [MineVerify](https://modrinth.com/plugin/mineverify) on a local Paper
server, then configure `plugins/MineVerify/config.yml` with the same token:

```yaml
language: "fr_fr"

apps:
  pmc-plan:
    name: "PMC Plan"
    base-url: "http://127.0.0.1:3000"
    token: "generated-token"
    poll-interval-seconds: 3

linking:
  code-ttl-seconds: 60
```

Restart both the Next.js development server and Paper after changing the
token. When Paper runs on another machine, replace `127.0.0.1` with the LAN
address of the computer running PMC Plan.

Before testing in game, verify connectivity and authentication from a regular
terminal:

```bash
TOKEN="$(grep '^MINEVERIFY_TOKEN=' .env.development.local | cut -d= -f2-)"
curl -i -H "Authorization: Bearer $TOKEN" \
  http://127.0.0.1:3000/api/mineverify/pending-requests
```

A working empty state returns HTTP `200` with `{"requests":[]}`. Then complete
the full flow:

1. Sign in to PMC Plan through Discord and open the Minecraft account-linking
   window from Settings.
2. Join the local Paper server and run `/mineverify`.
3. Wait for the generated code to appear in PMC Plan, then run
   `/mineverify <code>` in Minecraft.
4. Confirm that the player name and UUID shown by PMC Plan were stored in the
   local database.

`/mineverify status requests` can be used from the Paper console to inspect the
plugin state. If the restored baseline already contains a Minecraft link for
the development account, unlink it locally before starting the flow.

Temporary MineVerify requests are deliberately absent from shared snapshots
and are cleared by `db:pull` and `db:reset`. Resetting therefore restores the
durable baseline account link, if any, without reviving expired or pending
verification sessions.

An HTTP `401` means the application and plugin tokens differ, or the app was
not restarted after editing the environment. A MineVerify network error means
Paper cannot reach `base-url`. An empty pending-request list is expected until
an authenticated user opens the account-linking flow.

See [MineVerify API](api/mineverify.md) for the complete plugin protocol and
payload lifecycle.

## Database Commands

```bash
npm run db:start
npm run db:stop
npm run db:pull
npm run db:apply
npm run db:migrate -- --name describe_the_change
npm run db:reset
npm run db:verify
npm run db:studio
```

`db:migrate` creates and applies migrations after editing `schema.prisma`.
Commit the complete generated migration directory with the schema change.

`db:pull` downloads the latest shared baseline and immediately restores it.
`db:reset` restores the last downloaded archive without network access. Both
commands destroy and recreate only `pmc_plan_dev`, apply pending migrations,
restore the configured local Super Admin, and clear temporary MineVerify
requests. MineVerify request data is also excluded when publishing a baseline.

Every local Prisma and restoration command validates both connection URLs
before execution and rejects remote hosts or another database name.

`npm run build` uses the same local overrides and database guard when executed
on a developer machine. CI and Vercel builds instead retain the environment
variables supplied by their platform.

## Publishing the Shared Baseline

Only a maintainer with production and Supabase Storage credentials publishes a
new baseline. The required `.env.local` values are:

- `POSTGRES_URL_NON_POOLING`: the remote production database;
- `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`: maintainer-only Storage
  access;
- optional `DATABASE_SNAPSHOT_BUCKET`, `DATABASE_SNAPSHOT_OBJECT`, and
  `DATABASE_SNAPSHOT_URL_TTL_SECONDS` overrides.

Run:

```bash
npm run db:snapshot:publish
```

The command creates a consistent `public` schema dump through PostgreSQL 17,
creates the private Storage bucket when necessary, replaces the baseline
object, and prints a signed `DEV_DATABASE_SNAPSHOT_URL`. Share only that URL;
never share `SUPABASE_SERVICE_ROLE_KEY` or production database credentials.

Publishing is intentionally manual. It reads production but never migrates or
modifies it. The temporary local export is deleted after upload.

Signed URLs are bearer credentials. Replacing the object at the same path lets
existing contributors download the new baseline without changing their URL. To
revoke access, delete the old object, publish to a new object path, and issue
new signed URLs to the remaining contributors.

## Environment Isolation

The project deliberately uses only two application environments:

- local development with PostgreSQL in Docker and a private resettable snapshot;
- production with the hosted Supabase database and Vercel Production secrets.

Pull requests are validated locally and by CI. A shared staging database is not
part of the workflow, and Vercel Preview deployments must not receive production
database credentials. They may be used for build-only inspection when their
required non-production configuration is available, but they are not expected
to provide a complete authenticated application.

Local development and production must use distinct `MINEVERIFY_TOKEN` values.
The existing Discord OAuth application may be retained because localhost and
production callback URLs are already registered, while its secret remains
outside version control.

## Troubleshooting

If port `5432` is already occupied, stop the other PostgreSQL instance before
starting the container. Do not change the database guard to point at a remote
database as a workaround.

If `db:pull` returns an authorization error, request a new signed snapshot URL
from a maintainer. If `db:reset` reports that no local snapshot exists, run
`db:pull` first.

If migrations and the schema differ, create a new migration. Never edit a
migration that has already been applied to production.
