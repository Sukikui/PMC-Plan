# Developer Setup Guide

## 📑 Table of Contents

1. [Development Environment Overview](#-development-environment-overview)
2. [Prerequisites](#️-prerequisites)
3. [Repository Installation](#-repository-installation)
4. [Required Access and Secrets](#-required-access-and-secrets)
5. [Environment Configuration](#️-environment-configuration)
6. [Local Database Setup](#️-local-database-setup)
7. [Starting the Application](#-starting-the-application)
8. [Daily Development Workflow](#-daily-development-workflow)
9. [Database Schema Changes](#-database-schema-changes)
10. [PlayerCoordsAPI Setup](#-playercoordsapi-setup)
11. [MineVerify Setup](#-mineverify-setup)
12. [Quality Checks](#-quality-checks)
13. [Updating the Local Environment](#️-updating-the-local-environment)
14. [Troubleshooting](#-troubleshooting)
15. [Security and Safety Rules](#️-security-and-safety-rules)
16. [First Contribution Checklist](#-first-contribution-checklist)

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

Generate `AUTH_SECRET` locally with either method:

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

`MINEVERIFY_TOKEN` is also generated locally by the developer when MineVerify
testing is required. Run either command again to create a separate value.
The token must later match the one configured in the
local MineVerify plugin. See the
[MineVerify application integration guide](https://github.com/Sukikui/MineVerify/blob/main/docs/APP_INTEGRATION.md)
for the complete integration contract.

<br>

## ⚙️ Environment Configuration

Create `.env.development.local` from `.env.development.local.example`. This is
the only environment file contributors need. Fill in the values collected in
the previous section, leave `MINEVERIFY_TOKEN` empty when the integration is
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

## 📍 PlayerCoordsAPI Setup

## 🔗 MineVerify Setup

## ✅ Quality Checks

## ⬆️ Updating the Local Environment

## 🩺 Troubleshooting

## 🛡️ Security and Safety Rules

## 🎯 First Contribution Checklist
