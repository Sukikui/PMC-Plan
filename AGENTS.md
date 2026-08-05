# Repository Guidelines

## Most Important: Agent-Specific Instructions
- Domain: This is an itinerary planner for a French Minecraft server; keep domain wording consistent.
- Language: Keep UI copy, end-user messages, and user-facing data/config values in French. Code identifiers, code comments, technical configuration keys, and repository documentation must always be written in English.
- Git: Do not run written git commands such as `git commit` or `git push`. But you can use git commands to check the status of the repository, such as `git status`, `git diff`, and `git log`. For other git commands, you can ask me for accepting command running.
- Theming: App supports light and dark modes—never hardcode colors. Use shared tokens (see `lib/theme-colors.ts`) and update both themes.
- API Docs: When API endpoints or logic change, update `docs/BACKEND_API.md` and the relevant domain document under `docs/api/`.
- Principle: Adhere strictly to DRY; prefer shared utilities to duplication.
- Cleaning: When removing or refactoring features, also remove obsolete helpers, submodules, exports, dependencies, and tests. Confirm cleanup with `npm run check:unused`.
- Features: When I'm asking you to implement or refactor features, always check for existing helpers, utilities, or components that can be reused. Avoid creating new files unless necessary.
- Don't hesitate to propose codebase refactoring or improvements if two or more modules should share common frontend or backend logic but currently implement it differently.
- Verification: After substantial code changes, run `npm run check:quality`. Also run `npm run build` whenever production behavior, dependencies, configuration, routing, or bundling may be affected.
- No source files with more than 350 lines; split into focused modules if needed. This limit does not apply to docs, data files, generated files, lockfiles, or binary assets.
- No need to run `npm run dev` because I already have a dev server running. You can run tests and linting without starting the dev server.


## Project Structure & Module Organization
- `app/`: Next.js App Router (pages, `layout.tsx`, API routes under `app/api/**/route.ts`).
- `components/`: Reusable React components (PascalCase `.tsx`).
- `lib/`: Shared utilities and clients (e.g., `lib/prisma.ts`, `lib/theme-colors.ts`, path alias `@/*`).
- `prisma/`: Prisma schema (`schema.prisma`).
- `public/`: Static assets (icons, textures, and shared JSON like `public/data/nether_axes.json`).
- `tests/`: Jest tests (`*.test.ts`) and `tests/setup.js`.
- `.github/`: CI and repository automation.

## Build, Test, and Development Commands
- `npm run dev`: Start Next.js dev server on `http://localhost:3000`.
- `npm run build` / `npm start`: Build and run production server.
- `npm run lint` / `npm run type-check`: ESLint and TypeScript checks.
- `npm test` | `npm run test:watch` | `npm run test:coverage`: Run unit/integration tests and coverage.
- `npm run check:unused`: Detect unused code and dependencies in both repository and production graphs.
- `npm run check:quality`: Run linting, type checking, dead-code analysis, tests, and coverage thresholds.
- Database (requires `.env.local`): `npm run db:generate`, `npm run db:push`, `npm run db:studio`.

## Coding Style & Naming Conventions
- TypeScript, strict mode; React 19; Next.js 15 App Router.
- Indentation: 2 spaces; prefer named exports; keep modules focused.
- Components: PascalCase (`components/PositionPanel.tsx`). Utilities: kebab-case (`lib/theme-colors.ts`) unless an established domain convention differs.
- API routes: folder per route with `route.ts` (e.g., `app/api/nearest-portals/route.ts`).
- Data records live in PostgreSQL via Prisma, including `User`, `MapEntry`, `Place`, `Portal`, `Space`, `Service`, `TradeOffer`, and `TradeItem`.
- Linting: ESLint with Next/React rules. Run the complete `npm run check:quality` gate before a PR.

## Testing Guidelines
- Framework: Jest + ts-jest. Test files in `tests/` named `*.test.ts`.
- Coverage: Jest collects coverage across `app/`, `components/`, `lib/`, and root application entry points. The measured global baseline in `jest.config.cjs` is enforced in CI and must never decrease. Use `npm run test:coverage`.
- Dead code: `npm run check:unused` must pass for both the complete repository and the production-only graph. TypeScript rejects unused locals, parameters, labels, and unreachable code, while Knip rejects unused files, exports, dependencies, and unresolved imports.
- API integration: CI builds and starts the app, then runs `tests/api.test.ts` and `tests/integration.test.ts`. Locally, target files via `npm test -- tests/api.test.ts`.

## Commit & Pull Request Guidelines
- Commit style: Conventional Commits (`feat:`, `fix:`, `chore:`, optional scope like `fix(ui): ...`).
- PRs: Include clear description, linked issues, and screenshots/GIFs for UI changes. Note data model or place/portal ID changes.
- Checks: Ensure `npm run check:quality` and `npm run build` pass. Coverage baselines must never decrease.

## Security & Configuration Tips
- Copy `.env.local.example` to `.env.local`. Key vars: `DATABASE_URL`, `POSTGRES_URL_NON_POOLING`, `AUTH_SECRET`, `AUTH_URL`, `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`, and `MINEVERIFY_TOKEN`.
- Do not commit secrets. Use `npm run db:*` only with a safe database.
