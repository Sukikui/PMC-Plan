<div align="center">

<h1>
<img src="public/branding/pmc/mark.png" width="48" height="48" alt="PMC Plan icon" align="absbottom">
<a href="https://pmc-plan.vercel.app">PMC Plan</a>
</h1>

<p>
  <a href="https://nodejs.org/"><img src="https://img.shields.io/badge/Node.js-24-5FA04E?logo=nodedotjs&amp;logoColor=white" alt="Node.js 24"></a>
  <a href="https://nextjs.org/"><img src="https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs&amp;logoColor=white" alt="Next.js 16"></a>
  <a href="https://react.dev/"><img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&amp;logoColor=000000" alt="React 19"></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&amp;logoColor=white" alt="TypeScript 5.9"></a>
  <a href="https://www.prisma.io/"><img src="https://img.shields.io/badge/Prisma-7-2D3748?logo=prisma&amp;logoColor=white" alt="Prisma 7"></a>
  <a href="https://www.postgresql.org/"><img src="https://img.shields.io/badge/PostgreSQL-17-4169E1?logo=postgresql&amp;logoColor=white" alt="PostgreSQL 17"></a>
  <a href="https://tailwindcss.com/"><img src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&amp;logoColor=white" alt="Tailwind CSS 4"></a>
  <a href="https://authjs.dev/"><img src="https://img.shields.io/badge/Auth.js-5_beta-7C3AED" alt="Auth.js 5 beta"></a>
  <a href="https://tanstack.com/query/latest"><img src="https://img.shields.io/badge/TanStack_Query-5-FF4154?logo=reactquery&amp;logoColor=white" alt="TanStack Query 5"></a>
  <a href="https://zod.dev/"><img src="https://img.shields.io/badge/Zod-4-3E67B1?logo=zod&amp;logoColor=white" alt="Zod 4"></a>
</p>

<p>
  <a href="https://www.npmjs.com/"><img src="https://img.shields.io/badge/npm-package_manager-CB3837?logo=npm&amp;logoColor=white" alt="npm package manager"></a>
  <a href="https://jestjs.io/"><img src="https://img.shields.io/badge/Jest-30-C21325?logo=jest&amp;logoColor=white" alt="Jest 30"></a>
  <a href="https://eslint.org/"><img src="https://img.shields.io/badge/ESLint-9-4B32C3?logo=eslint&amp;logoColor=white" alt="ESLint 9"></a>
  <a href="https://knip.dev/"><img src="https://img.shields.io/badge/Knip-6-F7B93E" alt="Knip 6"></a>
  <a href="https://www.docker.com/"><img src="https://img.shields.io/badge/Docker-local_development-2496ED?logo=docker&amp;logoColor=white" alt="Docker development environment"></a>
  <a href="https://supabase.com/"><img src="https://img.shields.io/badge/Database-Supabase-3FCF8E?logo=supabase&amp;logoColor=white" alt="Database hosted on Supabase"></a>
  <a href="https://vercel.com/"><img src="https://img.shields.io/badge/Deployed_on-Vercel-000000?logo=vercel&amp;logoColor=white" alt="Deployed on Vercel"></a>
</p>

<p>
  <a href="https://discord.com/"><img src="https://img.shields.io/badge/OAuth-Discord-5865F2?logo=discord&amp;logoColor=white" alt="Discord OAuth"></a>
  <a href="https://www.minecraft.net/"><img src="https://img.shields.io/badge/Platform-Minecraft-62B47A?logo=minecraft&amp;logoColor=white" alt="Minecraft integration"></a>
  <a href="https://modrinth.com/mod/playercoordsapi"><img src="https://img.shields.io/badge/Mod-PlayerCoordsAPI-1BD96A?logo=modrinth&amp;logoColor=white" alt="PlayerCoordsAPI mod"></a>
  <a href="https://modrinth.com/plugin/mineverify"><img src="https://img.shields.io/badge/Plugin-MineVerify-1BD96A?logo=modrinth&amp;logoColor=white" alt="MineVerify plugin"></a>
  <a href="https://modrinth.com/plugin/biomemap"><img src="https://img.shields.io/badge/Plugin-BiomeMap-1BD96A?logo=modrinth&amp;logoColor=white" alt="BiomeMap plugin"></a>
  <a href="https://mcheads.org/"><img src="https://img.shields.io/badge/API-MC_Heads-8B5CF6" alt="MC Heads API"></a>
  <a href="https://mcasset.cloud/"><img src="https://img.shields.io/badge/Assets-mcasset.cloud-EF8E21" alt="Minecraft assets from mcasset.cloud"></a>
</p>

Web application integrating interactive map, itinerary planner, and community directory for the French
Minecraft server [Play-MC.fr](https://play-mc.fr).

</div>

> [!NOTE]
> The project is under active development. The documentation is incomplete and may not reflect 
> the current state of the codebase.

## 📚 Contents

- [Main features](#-main-features)
- [Technology](#-technology)
- [Quick start](#-quick-start)
- [Project structure](#-project-structure)
- [Common commands](#-common-commands)
- [Documentation](#-documentation)
- [Contributing](#-contributing)

## ✨ Main Features

- high-resolution Overworld and Nether maps with tiled rendering;
- cross-world itinerary planning through linked portals and Nether axes;
- community places, portals, spaces, trade offers, and services;
- Discord authentication, account approval, and role-based administration;
- Minecraft account verification through MineVerify;
- live player position synchronization through PlayerCoordsAPI.

## 🧱 Technology

The application uses [Next.js](https://nextjs.org/) and
[React](https://react.dev/) with TypeScript. PostgreSQL is accessed through
[Prisma](https://www.prisma.io/), server state is managed with
[TanStack Query](https://tanstack.com/query/latest), and authentication uses
[Auth.js](https://authjs.dev/) with Discord OAuth.

See [Architecture](docs/ARCHITECTURE.md) for the runtime layers, domain model,
and data flow.

## 🚀 Quick Start

### Prerequisites

- Node.js 24 LTS and npm;
- Docker Desktop, Docker Engine, or another Docker-compatible runtime;
- the shared application secrets supplied by a maintainer;
- the private development snapshot URL supplied by a maintainer;
- a Discord account whose numeric ID can be used for local development.

### Installation

On macOS with Homebrew, install Node.js 24 and expose it in the shell before
installing the project:

```bash
brew install node@24
echo 'export PATH="/opt/homebrew/opt/node@24/bin:$PATH"' >> ~/.zshrc
exec zsh
```

```bash
git clone https://github.com/Sukikui/PMC-Map.git
cd PMC-Map
npm install
```

Keep the shared Discord and application configuration in `.env.local`. Do not
replace that file with development database credentials or local integration
tokens. Create the isolated local override instead:

```bash
cp .env.development.example .env.development.local
```

Set `DEV_DATABASE_SNAPSHOT_URL`, `DEV_DISCORD_ID`, and a dedicated local
`MINEVERIFY_TOKEN` in `.env.development.local`, then initialize and start the
application:

```bash
npm run dev:setup
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Signing in through the
regular Discord OAuth flow gives the configured account the Super Admin role in
the local database only.

The complete setup, environment isolation rules, and troubleshooting steps are
documented in [Local Development](docs/DEVELOPMENT.md).

## 🗂️ Project Structure

```text
app/          Next.js pages, global styles, and HTTP route handlers
components/   Reusable UI, map layers, panels, overlays, and forms
lib/          Domain logic, data access, validation, caching, and integrations
prisma/       Database schema and migrations
public/       Static branding, map metadata, overview images, and tiles
scripts/      Repository and database tooling
tests/        Jest unit and integration tests
docs/         Architecture, workflows, formats, and API references
```

Read [Architecture](docs/ARCHITECTURE.md) before changing cross-cutting data,
overlay, authorization, or map behavior.

## 🛠️ Common Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development server after validating the local database. |
| `npm run dev:setup` | Start PostgreSQL and restore the shared development snapshot. |
| `npm run check:quality` | Run linting, types, dead-code analysis, tests, and coverage thresholds. |
| `npm run build` | Create the production build. |
| `npm run db:migrate -- --name <name>` | Create and apply a local schema migration. |
| `npm run db:pull` | Download the latest private snapshot and restore it locally. |
| `npm run db:reset` | Restore the last downloaded snapshot without network access. |
| `npm run db:studio` | Open Prisma Studio against the local database. |

All available database commands are listed in
[Local Development](docs/DEVELOPMENT.md). Code quality checks are explained in
[Code Quality](docs/CODE_QUALITY.md).

## 📖 Documentation

Start with the [documentation index](docs/README.md). The main contributor
references are:

- [Architecture](docs/ARCHITECTURE.md)
- [Local Development](docs/DEVELOPMENT.md)
- [Code Quality](docs/CODE_QUALITY.md)
- [Database Deployment](docs/DATABASE_DEPLOYMENT.md)
- [Backend API](docs/BACKEND_API.md)
- [Map Image Format](docs/MAP_IMAGE_FORMAT.md)

## 🤝 Contributing

1. Create a branch from the maintained base branch.
2. Keep UI copy in French and technical code or documentation in English.
3. Reuse existing domain helpers and UI primitives before adding abstractions.
4. Add focused tests and run `npm run check:quality`.
5. Commit generated Prisma migrations with every schema change.

Detailed repository rules live in [AGENTS.md](AGENTS.md). By contributing, you
agree that your changes are distributed under the [MIT License](LICENSE).
