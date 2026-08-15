# Documentation

This index is the entry point for PMC Plan's contributor and technical
documentation. Each document owns one topic so setup instructions,
architecture, operational procedures, and API contracts remain separate.

## Start Here

- [Development Setup](../README.md#developer-setup-guide): install the
  prerequisites, configure the local environment, restore the development
  database, and run the app.
- [Application Architecture](ARCHITECTURE.md): understand runtime layers,
  domain boundaries, data loading, authorization, maps, and routing.

## Engineering

- [Code Quality](CODE_QUALITY.md): linting, type checking, dead-code analysis,
  tests, coverage, and dependency security.
- [Database Deployment](DATABASE_DEPLOYMENT.md): maintain the migration baseline
  and deploy schema changes to production.

## API References

- [Backend API](BACKEND_API.md): core route planning, authentication,
  administration, and map-entry endpoints.
- [Public Data Loading](api/data-loading.md): projections, progressive details,
  pagination, caching, and invalidation.
- [Spaces API](api/spaces.md): space data, permissions, mutations, and manager
  transfers.
- [Services API](api/services.md): service data, contact modes, permissions, and
  mutations.
- [Minecraft Items API](api/minecraft-items.md): localized item and block data,
  textures, external sources, and caching.
- [MineVerify API](api/mineverify.md): authenticated server-plugin requests and
  the temporary account-linking lifecycle.

## Maps and Player Assets

- [Map Image Format](MAP_IMAGE_FORMAT.md): overview images, tiles, coordinates,
  metadata, and world directory conventions.
- [Minecraft Player Renders](MINECRAFT_HEADS.md): MC Heads endpoints, rendering
  scope, and local fallback behavior.

When endpoint behavior changes, update `BACKEND_API.md` and the relevant domain
reference under `docs/api/`.
