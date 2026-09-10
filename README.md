<div align="center">

<h1>
<img src="public/branding/pmc/mark.png" width="48" height="48" alt="PMC Plan icon" align="absbottom">
<a href="https://pmc-plan.vercel.app">PMC Plan</a>
</h1>

<p>
  <a href="https://nextjs.org/"><img src="https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs&amp;logoColor=white" alt="Next.js 16"></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&amp;logoColor=white" alt="TypeScript 5.9"></a>
  <a href="https://react.dev/"><img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&amp;logoColor=white" alt="React 19"></a>
  <a href="https://nodejs.org/"><img src="https://img.shields.io/badge/Node.js-24-5FA04E?logo=nodedotjs&amp;logoColor=white" alt="Node.js 24"></a>
  <a href="https://www.prisma.io/"><img src="https://img.shields.io/badge/Prisma-7-2D3748?logo=prisma&amp;logoColor=white" alt="Prisma 7"></a>
  <a href="https://www.postgresql.org/"><img src="https://img.shields.io/badge/PostgreSQL-17-4169E1?logo=postgresql&amp;logoColor=white" alt="PostgreSQL 17"></a>
  <a href="https://tailwindcss.com/"><img src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&amp;logoColor=white" alt="Tailwind CSS 4"></a>
  <a href="https://www.docker.com/"><img src="https://img.shields.io/badge/Docker-local_development-2496ED?logo=docker&amp;logoColor=white" alt="Docker development environment"></a>
  <a href="https://supabase.com/"><img src="https://img.shields.io/badge/Database-Supabase-3FCF8E?logo=supabase&amp;logoColor=white" alt="Database hosted on Supabase"></a>
  <a href="https://vercel.com/"><img src="https://img.shields.io/badge/Deployed_on-Vercel-000000?logo=vercel&amp;logoColor=white" alt="Deployed on Vercel"></a>
  <a href="https://discord.com/"><img src="https://img.shields.io/badge/OAuth-Discord-5865F2?logo=discord&amp;logoColor=white" alt="Discord OAuth"></a>
  <a href="https://modrinth.com/mod/playercoordsapi"><img src="https://img.shields.io/badge/Mod-PlayerCoordsAPI-1BD96A?logo=modrinth&amp;logoColor=white" alt="PlayerCoordsAPI mod"></a>
  <a href="https://modrinth.com/plugin/mineverify"><img src="https://img.shields.io/badge/Plugin-MineVerify-1BD96A?logo=modrinth&amp;logoColor=white" alt="MineVerify plugin"></a>
  <a href="https://modrinth.com/plugin/biomemap"><img src="https://img.shields.io/badge/Plugin-BiomeMap-1BD96A?logo=modrinth&amp;logoColor=white" alt="BiomeMap plugin"></a>
  <a href="https://mcheads.org/"><img src="https://img.shields.io/badge/API-MC_Heads-8B5CF6" alt="MC Heads API"></a>
</p>

Collaborative and open-source web application integrating interactive map, itinerary planner, and community directory for the French
Minecraft server [Play-MC.fr](https://play-mc.fr).

</div>

## 📑 Table of Contents
1. [Development Environment Overview](#-development-environment-overview)
2. [Project Structure](#️-project-structure)
3. [Prerequisites](#️-prerequisites)
4. [Repository Installation](#-repository-installation)
5. [Required Access and Secrets](#-required-access-and-secrets)
6. [Environment Configuration](#️-environment-configuration)
7. [Local Database Setup](#️-local-database-setup)
8. [Starting the Application](#-starting-the-application)
9. [Daily Development Workflow](#-daily-development-workflow)
10. [Database Schema Changes](#-database-schema-changes)
11. [PlayerCoordsAPI Setup](#-playercoordsapi-setup)
12. [MineVerify Setup](#-mineverify-setup)
13. [Quality Checks](#-quality-checks)
14. [Updating the Local Environment](#️-updating-the-local-environment)
15. [Troubleshooting](#-troubleshooting)
16. [First Contribution Checklist](#-first-contribution-checklist)
17. [Documentation](#-documentation)

## 🧭 Development Environment Overview

PMC Plan is a full-stack Next.js application: `app/` contains the page and HTTP
route boundaries, `components/` contains the interactive interface, and `lib/`
contains shared domain logic, validation, data loading, caching, and external
integrations. Prisma connects the server-side code to PostgreSQL through the
schema and migrations stored in `prisma/`.

The production application is deployed on Vercel and uses a PostgreSQL database
hosted by Supabase. During development, Next.js runs locally and the database is
replaced by an isolated PostgreSQL container managed through Docker. This local
database is initialized from a development snapshot and can be modified or
reset without accessing or affecting production data.

The browser loads lightweight content for the map and navigation views, then
requests complete records only when an overlay or management screen needs them.
Discord provides authentication and application identities, while the backend
remains responsible for validating requests, enforcing permissions, and
persisting places, linked portals, spaces, services, offers, and Minecraft
account links.

Generated map images, tiles, metadata, and other static assets are stored under
`public/`; markers and community content come from PostgreSQL. Route planning
combines those records with linked portals and the Nether transport network.
PlayerCoordsAPI and MineVerify provide optional connections to a local
Minecraft client and server, while external Minecraft APIs supply player and
item assets.

<br>

## 🗂️ Project Structure

PMC Plan separates HTTP boundaries, reusable interface code, domain behavior,
persistence, generated assets, and repository tooling.

```text
.
├── app/                  Next.js pages, layout, styles, and API routes
│   └── api/              HTTP route handlers grouped by endpoint
├── components/           Feature-oriented React interface
│   └── ui/               Shared controls and presentation primitives
├── lib/                  Domain logic, data access, validation, and integrations
├── prisma/               PostgreSQL schema and versioned migrations
├── public/               Branding, static data, map overviews, and tiles
├── scripts/              Build and guarded local database tooling
├── tests/                Jest unit, route, and integration tests
├── docs/                 Architecture, operations, formats, and API references
├── .github/workflows/    Continuous integration workflows
└── generated/prisma/     Generated Prisma Client
```

<br>

## 🛠️ Prerequisites

PMC Plan requires Node.js 24 and a running Docker environment. PostgreSQL and
Prisma do not need to be installed globally: PostgreSQL runs in Docker, and the
project installs its own Prisma CLI with the other npm dependencies.

### Node.js and npm

Install Node.js 24. npm is included with Node.js and must not be installed
separately. The macOS commands below use
[Homebrew](https://brew.sh/), install it first if `brew` is not available.

<table>
  <thead>
    <tr>
      <th>Operating system</th>
      <th>Installation</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Windows (PowerShell)</td>
      <td>

```powershell
winget install --exact --id OpenJS.NodeJS.LTS
```

</td>
    </tr>
    <tr>
      <td>macOS (Homebrew)</td>
      <td>

```bash
brew install node@24
echo 'export PATH="$(brew --prefix node@24)/bin:$PATH"' >> ~/.zshrc
exec zsh
```

</td>
    </tr>
    <tr>
      <td>Debian / Ubuntu</td>
      <td>

```bash
curl -fsSL https://deb.nodesource.com/setup_24.x \
  -o /tmp/nodesource_setup.sh
sudo -E bash /tmp/nodesource_setup.sh
sudo apt-get install -y nodejs
```

</td>
    </tr>
  </tbody>
</table>

For another Linux distribution, use the matching instructions from the
[official Node.js download page](https://nodejs.org/en/download). An existing
Node.js version manager such as nvm, fnm, or Volta can also be used as long as
it activates Node.js 24 inside the repository.

Confirm that both commands are available:

```bash
node --version
npm --version
```

The Node.js version must start with `v24`.

### Docker

Docker runs the isolated PostgreSQL development database. The application
itself continues to run directly through Node.js.

<table>
  <thead>
    <tr>
      <th>Operating system</th>
      <th>Installation</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Windows (PowerShell)</td>
      <td>

```powershell
winget install --exact --id Docker.DockerDesktop
Start-Process "$Env:ProgramFiles\Docker\Docker\Docker Desktop.exe"
```

</td>
    </tr>
    <tr>
      <td>macOS (Homebrew)</td>
      <td>

```bash
brew install --cask docker
open -a Docker
```

</td>
    </tr>
    <tr>
      <td>Linux</td>
      <td>

```bash
curl -fsSL https://get.docker.com -o /tmp/get-docker.sh
sudo sh /tmp/get-docker.sh
sudo systemctl enable --now docker
sudo usermod -aG docker "$USER"
```

</td>
    </tr>
  </tbody>
</table>

The Linux installation requires signing out and back in after adding the
current user to the `docker` group. Distribution-specific alternatives are
available in the [Docker Engine installation guide](https://docs.docker.com/engine/install/).
Docker Desktop or Docker Engine must remain running whenever the local database
is in use.

Confirm that the Docker engine and Docker Compose are available:

```bash
docker version
docker compose version
```
<br>

## 📦 Repository Installation

Fork and clone the repository, then open a terminal in the root directory and install the project dependencies:

```bash
npm install
```

npm installs the versions resolved by `package-lock.json` into the local
`node_modules/` directory. The project's `postinstall` script also generates
the Prisma Client from `prisma/schema.prisma`, Prisma does not need to be
installed globally.

Do not start the application yet. Its local environment and isolated database
must be configured first.

<br>

## 🔑 Required Access and Secrets

Collect the following values before configuring the environment:

| Value                       | Source                             | Required |
|-----------------------------|------------------------------------|----------|
| `DISCORD_CLIENT_ID`         | Provided by a maintainer           | Yes      |
| `DISCORD_CLIENT_SECRET`     | Provided by a maintainer           | Yes      |
| `DEV_DATABASE_SNAPSHOT_URL` | Provided by a maintainer           | Yes      |
| `AUTH_SECRET`               | Generated locally by the developer | Yes      |
| `DEV_DISCORD_ID`            | Your Discord numeric user ID       | Yes      |
| `MINEVERIFY_TOKEN`          | Generated locally by the developer | Optional |

### Discord OAuth2 Application

Production and local development use the same OAuth2 application. It
already allows both PMC Plan callback URLs:

```text
https://pmc-plan.vercel.app/api/auth/callback/discord
http://localhost:3000/api/auth/callback/discord
```

The maintainer provides this application's `DISCORD_CLIENT_ID` and
`DISCORD_CLIENT_SECRET`. Contributors use them locally and do not need to create
or configure another Discord application.
To retrieve `DEV_DISCORD_ID`, enable **Developer Mode** under
**User Settings > Advanced** in Discord, open your account's context menu, and
select **Copy User ID**.

### Generated Secrets

Generate `AUTH_SECRET` locally with either method.
When MineVerify testing is required, run either command again to generate a
separate `MINEVERIFY_TOKEN`.

<table>
  <thead>
    <tr>
      <th>Method</th>
      <th>Command</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>OpenSSL</td>
      <td>

```bash
openssl rand -base64 32
```

</td>
    </tr>
    <tr>
      <td>Node.js</td>
      <td>

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

</td>
    </tr>
  </tbody>
</table>

<br>

## ⚙️ Environment Configuration

Create `.env.development.local` from `.env.development.local.example`. This is
the only environment file contributors need. Fill in the values collected in
the section [🔑 Required Access and Secrets](#-required-access-and-secrets).

Leave `MINEVERIFY_TOKEN` empty when the integration is
not being tested, and keep the provided `AUTH_URL`, `DATABASE_URL`, and
`POSTGRES_URL_NON_POOLING` values unchanged.

`.env.local.example` documents the maintainer and deployment configuration. An
actual `.env.local` file is only used for controlled maintainer workflows such
as publishing a development snapshot. Contributors must not create one. Local
environment files are ignored by Git and must never be committed.

<br>

## 🗄️ Local Database Setup

Make sure Docker Desktop or Docker Engine is running, then initialize the local
database:

```bash
npm run dev:setup
```

This command:

1. starts PostgreSQL 17 in Docker
2. generates Prisma Client
3. downloads the development snapshot
4. restores it into the local `pmc_plan_dev` database
5. applies all committed Prisma migrations
6. creates or promotes the account identified by `DEV_DISCORD_ID` to **Super Admin**
7. removes temporary MineVerify requests
8. verifies the database, migration history, and development account

The PostgreSQL container stores its data in a Docker volume, so stopping Docker
does not erase the database. All changes remain local and cannot affect the
production database.

<br>

## 🚀 Starting the Application

Start the Next.js development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), then confirm that the map
and the content restored from the snapshot are available. Sign in with Discord
and verify that the Administration tab is accessible. The first login also
synchronizes the current Discord profile with the local user created for
`DEV_DISCORD_ID`.

Docker must remain running while the application uses PostgreSQL. Pressing
`Ctrl+C` stops only the Next.js server; it does not stop or erase the local
database. The Super Admin role assigned during setup remains limited to this
local database.

<br>

## 🔄 Daily Development Workflow

After the initial setup, a normal development session only requires starting
Docker, the existing database, and Next.js:

```bash
npm run db:start
npm run dev
```

Next.js reloads application changes automatically. Data created, edited, or
deleted through the application remains in the local database between sessions.
To inspect it directly, open Prisma Studio in another terminal:

```bash
npm run db:studio
```

Press `Ctrl+C` to stop Next.js. The PostgreSQL container can remain running, or
it can be stopped separately without deleting its data:

```bash
npm run db:stop
```

Do not run `npm run dev:setup` at the beginning of every session. Updating or
restoring the development database is covered in the section
[⬆️ Updating the Local Environment](#-updating-the-local-environment).

<br>

## 🧱 Database Schema Changes

Update `prisma/schema.prisma`, then create and apply a migration against the
local database:

```bash
npm run db:migrate -- --name descriptive_migration_name
```

Review the generated SQL under `prisma/migrations/` before adapting the affected
application code, tests, and documentation.

Before opening a pull request, verify that the migration can be applied over
the populated development snapshot. The following command erases current local
data, restores the snapshot, and applies every committed migration:

```bash
npm run db:reset
```

Then confirm that the restored database matches the Prisma schema:

```bash
npm run db:check
```

This reset catches migrations that succeed on an empty database but fail when
rows already exist. New required fields must therefore include an appropriate
default or data backfill when existing records cannot satisfy them directly.

Every schema change must include its generated migration. Migrations are created
and tested only against the local `pmc_plan_dev` database, and a migration that
has already been shared must not be edited retroactively. `prisma db push` is
not part of the project workflow.

Contributors never apply migrations directly to production. The maintainer
procedure is documented in
[Database Deployment](docs/DATABASE_DEPLOYMENT.md).

<br>

## 📍 PlayerCoordsAPI Setup

PlayerCoordsAPI is optional and does not require an environment variable. To
test live position synchronization, install
[Fabric Loader](https://fabricmc.net/use/) and download a PlayerCoordsAPI version
compatible with the project's Minecraft version from
[Modrinth](https://modrinth.com/mod/playercoordsapi).

Open the mod configuration through Mod Menu, then:

1. enable the API;
2. keep the API port set to `25565`;
3. set requests with an `Origin` header to `Whitelist`;
4. allow the local origin `http://localhost:3000`.

Launch Minecraft and join a world, then verify the local endpoint:

```bash
curl http://localhost:25565/api/coords
```

The response should contain the current world, coordinates, UUID, and username.
In PMC Plan, click **Synchroniser** and confirm that the displayed world,
coordinates, and player render follow the Minecraft client.

The API is read-only and accepts only loopback connections from the local
machine. It returns `404` while the player is not in a world. PMC Plan always
uses port `25565`, so changing it in the mod prevents synchronization.

> [!NOTE]
> Safari supports synchronization from the local HTTP application but blocks the
> loopback request from the deployed HTTPS application. Chrome and Firefox support
> both environments.

<br>

## 🔗 MineVerify Setup

MineVerify testing is optional. It requires a local
[PaperMC](https://papermc.io/downloads/paper) server running on Java 25 or later.
Download MineVerify from [Modrinth](https://modrinth.com/plugin/mineverify),
place the plugin JAR in the server's `plugins/` directory, and start the server
once to generate its configuration.

Edit `plugins/MineVerify/config.yml`:

```yaml
language: "fr_fr"

apps:
  pmc-plan:
    name: "PMC Plan"
    base-url: "http://127.0.0.1:3000"
    token: "same-token-as-MINEVERIFY_TOKEN"
    poll-interval-seconds: 3

linking:
  code-ttl-seconds: 60
```

The configured token must exactly match `MINEVERIFY_TOKEN` in
`.env.development.local`. `base-url` points to the application root and must not
include `/api`. MineVerify makes outbound requests to PMC Plan, the application
does not connect to the Minecraft server.

To test the complete account-linking flow:

1. start PMC Plan and the local Minecraft server;
2. sign in with Discord and open the Minecraft account-linking window;
3. join the server and run `/mineverify`;
4. wait for PMC Plan to display the generated command;
5. run `/mineverify <code>` in Minecraft;
6. confirm that the Minecraft account appears as linked in PMC Plan.

Administrators can inspect the plugin from the Minecraft server console with:

```text
/mineverify status
/mineverify status requests
```

The endpoint contract and callback payloads are documented in the
[MineVerify application integration guide](https://github.com/Sukikui/MineVerify/blob/main/docs/APP_INTEGRATION.md).

<br>

## ✅ Quality Checks

During development, run a focused Jest file when the affected behavior has a
dedicated test. For example:

```bash
npm test -- tests/playercoords-api.test.ts
```

Replace the path with the test file relevant to the current change.

Use watch mode when iterating repeatedly on tests:

```bash
npm run test:watch
```

Before opening a pull request, run the complete local quality gate and the
production build:

```bash
npm run check:quality
npm run build
```

`check:quality` runs the dependency security audit, ESLint, TypeScript checking, Knip dead-code and dependency
analysis, the complete Jest suite, and the enforced coverage thresholds. The
HTML coverage report is generated under `coverage/`; the repository baseline
must not decrease.

To run only the dependency security audit:

```bash
npm run check:security
```

GitHub Actions repeats these checks, validates migrations against PostgreSQL,
and builds the application for every pull request. See
[Code Quality](docs/CODE_QUALITY.md) for the individual commands and guidance on
interpreting their results.

<br>

## ⬆️ Updating the Local Environment

After updating the repository, synchronize dependencies and apply any newly
committed migrations without replacing local data:

```bash
npm install
npm run db:start
npm run db:apply
```

If `.env.development.local.example` changed, manually add or update the matching
values in `.env.development.local`.

To discard local database changes and restore the snapshot that is already
stored on the machine, run:

```bash
npm run db:reset
```

To download the latest shared snapshot before restoring it, run:

```bash
npm run db:pull
```

Both commands erase the current contents of `pmc_plan_dev`, apply all committed
migrations, and recreate the local Super Admin account. `db:pull` first replaces
`.local/database/development-baseline.dump` using
`DEV_DATABASE_SNAPSHOT_URL`, while `db:reset` works without network access from
the previously downloaded file.

The local snapshot is ignored by Git and is not updated automatically. If its
signed URL expires or changes, request a new value from a maintainer. These
operations remain restricted to the local database and never modify production.

<br>

## 🩺 Troubleshooting

| Problem | Check and resolution |
| --- | --- |
| Docker is unavailable or the database is stopped | Confirm that `docker version` succeeds, then run `npm run db:start`. |
| PostgreSQL cannot bind to port `5432` | Stop the other PostgreSQL instance or container already using the port. |
| A database command is rejected by the safety guard | Confirm that both database URLs target `pmc_plan_dev` on `localhost`, exactly as provided in the example. |
| No local snapshot is available | Run `npm run db:pull` before attempting another reset. |
| Snapshot download returns `401` or `403` | Request a new signed snapshot URL from a maintainer. |
| `DEV_DATABASE_SNAPSHOT_URL` is parsed incorrectly | Keep the complete signed URL between double quotes in `.env.development.local`. |
| Port `3000` is already occupied | Stop the process using it. Do not let Next.js switch to `3001`, because the local Discord callback targets port `3000`. |
| Discord rejects the connection | Check `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`, `AUTH_URL`, and the registered localhost callback. |
| The Administration tab is missing | Check `DEV_DISCORD_ID`, run `npm run db:bootstrap`, then sign out and sign in again. |
| Prisma Client does not match the schema | Run `npm run db:generate`, followed by `npm run db:apply`. |
| PlayerCoordsAPI cannot synchronize | Confirm that Minecraft is running in a world and check the mod state, port `25565`, and localhost origin whitelist. |
| MineVerify reports a network error or `401` | Compare the two tokens, check the configured `base-url`, then inspect `/mineverify status`. |

<br>

## 🎯 First Contribution Checklist

- [ ] Node.js 24, npm, Docker, and Docker Compose are available.
- [ ] Dependencies are installed with `npm install`.
- [ ] `.env.development.local` contains every required value.
- [ ] `npm run dev:setup` completes successfully.
- [ ] PMC Plan opens on `http://localhost:3000`.
- [ ] Discord authentication works and the Administration tab is available.
- [ ] `AGENTS.md`, [Application Architecture](docs/ARCHITECTURE.md), the
      [documentation index](docs/README.md), and the references relevant to the
      change have been read.
- [ ] Existing components and helpers have been checked before adding new code.
- [ ] Tests, migrations, and documentation have been updated when required.
- [ ] `npm run check:quality` and `npm run build` pass.
- [ ] The final diff contains only the intended files and no local credentials.

<br>

## 📖 Documentation

The repository documentation is split by responsibility. This list covers every
maintained guide and reference currently available.

### Entry Points

- [Developer Setup Guide](#developer-setup-guide): complete contributor setup,
  environment configuration, local database workflow, integrations, daily
  development, and troubleshooting.
- [Documentation Index](docs/README.md): navigation by engineering, API, map,
  and player-asset topic.
- [Repository Guidelines](AGENTS.md): language, architecture, quality,
  database-safety, Git, and contribution rules followed in this repository.

### Engineering and Operations

- [Application Architecture](docs/ARCHITECTURE.md): runtime layers, provider
  tree, domain model, authorization, data loading, caching, maps, and routing.
- [Code Quality](docs/CODE_QUALITY.md): linting, type checking, dead-code
  analysis, dependency security, tests, coverage, and the complete quality gate.
- [Database Deployment](docs/DATABASE_DEPLOYMENT.md): migration baseline and
  production schema deployment responsibilities.

### Backend and Domain APIs

- [Backend API](docs/BACKEND_API.md): route calculation, Discord
  authentication, approval, administration, map-entry management, places, and
  portals.
- [Public Data Loading](docs/api/data-loading.md): lightweight map projections,
  progressive details, pagination, caching, and invalidation.
- [Spaces API](docs/api/spaces.md): space model, permissions, public responses,
  mutations, transfers, and account deletion.
- [Services API](docs/api/services.md): service model, contact modes,
  permissions, public responses, and mutations.
- [Minecraft Items API](docs/api/minecraft-items.md): item and block resolution,
  localization, textures, external sources, and caching.
- [MineVerify API](docs/api/mineverify.md): authenticated plugin endpoints and
  the temporary Minecraft account-linking lifecycle.

### Maps and Minecraft Assets

- [Map Image Format](docs/MAP_IMAGE_FORMAT.md): world overviews,
  high-resolution tiles, coordinate origins, naming, directories, and metadata.
- [Minecraft Player Renders](docs/MINECRAFT_HEADS.md): MC Heads endpoints,
  rendering usage, cache behavior, and local fallbacks.
