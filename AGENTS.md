# Repository Guidelines

## Most Important: Agent-Specific Instructions
- Domain: This is an itinerary planner for a French Minecraft server; keep domain wording consistent.
- Language: Keep UI copy, end-user messages, and user-facing data/config values in French. Code identifiers, code comments, technical configuration keys, and repository documentation must always be written in English.
- Git: Do not run git commands in automation; maintainers handle commits.
- Theming: App supports light and dark modes—never hardcode colors. Use shared tokens (see `lib/theme-colors.ts`) and update both themes.
- API Docs: When API endpoints or logic change, update `BACKEND_API.md` with clear internal logic for each endpoint.
- Principle: Adhere strictly to DRY; prefer shared utilities to duplication.
- Features: When I'm asking you to implement or refactor features, always check for existing helpers, utilities, or components that can be reused. Avoid creating new files unless necessary.
- Don't hesitate to propose a codebase refactoring / improvenents if you see two or more different modules that should share a common frontend and backend logic but are currently implemented in different ways.
- No source files with more than 350 lines; split into focused modules if needed. This limit does not apply to docs, data files, generated files, lockfiles, or binary assets.
- When you clean up old code or remove features, also remove related helpers, submodules, and tests in order to keep the codebase clean and DRY.
- No need to run `npm run dev` because I already have a dev server running. You can run tests and linting without starting the dev server.


## Project Structure & Module Organization
- `app/`: Next.js App Router (pages, `layout.tsx`, API routes under `app/api/**/route.ts`).
- `components/`: Reusable React components (PascalCase `.tsx`).
- `lib/`: Shared utilities and clients (e.g., `lib/prisma.ts`, `ui-utils.ts`, path alias `@/*`).
- `prisma/`: Prisma schema (`schema.prisma`).
- `public/`: Static assets (icons, textures, and shared JSON like `public/data/nether_axes.json`).
- `tests/`: Jest tests (`*.test.ts`) and `tests/setup.js`.
- `.github/`: CI and repository automation.

## Build, Test, and Development Commands
- `npm run dev`: Start Next.js dev server on `http://localhost:3000`.
- `npm run build` / `npm start`: Build and run production server.
- `npm run lint` / `npm run type-check`: ESLint and TypeScript checks.
- `npm test` | `npm run test:watch` | `npm run test:coverage`: Run unit/integration tests and coverage.
- Database (requires `.env.local`): `npm run db:generate`, `npm run db:push`, `npm run db:studio`.

## Coding Style & Naming Conventions
- TypeScript, strict mode; React 18+; Next.js 15 App Router.
- Indentation: 2 spaces; prefer named exports; keep modules focused.
- Components: PascalCase (`components/TravelPlan.tsx`). Utilities: camelCase (`lib/ui-utils.ts`).
- API routes: folder per route with `route.ts` (e.g., `app/api/nearest-portals/route.ts`).
- Data records live in PostgreSQL via Prisma (`Place`, `Portal`, `TradeOffer`, `TradeItem` tables).
- Linting: ESLint with Next/React rules. Run `npm run lint` before pushing.

## Testing Guidelines
- Framework: Jest + ts-jest. Test files in `tests/` named `*.test.ts`.
- Coverage: Global threshold 70% (branches/functions/lines/statements). Use `npm run test:coverage`.
- API integration: CI builds and starts the app, then runs `tests/api.test.ts` and `tests/integration.test.ts`. Locally, target files via `npm test -- tests/api.test.ts`.

## Commit & Pull Request Guidelines
- Commit style: Conventional Commits (`feat:`, `fix:`, `chore:`, optional scope like `fix(ui): ...`).
- PRs: Include clear description, linked issues, and screenshots/GIFs for UI changes. Note data model or place/portal ID changes.
- Checks: Ensure `lint`, `type-check`, `build`, and tests pass. Keep coverage ≥ 70%.

## Security & Configuration Tips
- Copy `.env.local.example` to `.env.local`. Key vars: `DATABASE_URL`, `POSTGRES_URL_NON_POOLING`, `AUTH_SECRET`, `AUTH_URL`, `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`, and `MINEVERIFY_TOKEN`.
- Do not commit secrets. Use `npm run db:*` only with a safe database.
