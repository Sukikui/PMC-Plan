# Documentation Index

This directory contains the contributor and integration documentation for PMC
Plan. Start with the local setup, then use the topic-specific references below.

## 🚀 Contributor Guides

- [Local Development](DEVELOPMENT.md): local PostgreSQL, private snapshots,
  developer identity bootstrap, MineVerify testing, and database commands.
- [Architecture](ARCHITECTURE.md): runtime layers, domain boundaries, data
  loading, authorization, and extension points.
- [Code Quality](CODE_QUALITY.md): linting, type checking, dead-code analysis,
  tests, and coverage.
- [Database Deployment](DATABASE_DEPLOYMENT.md): migration baseline and the
  production release procedure.

## 🗺️ Maps and Assets

- [Map Image Format](MAP_IMAGE_FORMAT.md): overview images, tile generation,
  coordinates, metadata, and directory conventions.
- [Minecraft Player Renders](MINECRAFT_HEADS.md): MC Heads endpoints, rendering
  scope, and local fallback behavior.

## 🔌 Application APIs

- [Backend API](BACKEND_API.md): route planning, Nether addressing, linked
  portals, authentication, administration, and content endpoints.
- [Public Data Loading](api/data-loading.md): lightweight collections,
  progressive details, pagination, caching, and invalidation.
- [Spaces API](api/spaces.md): space data model, permissions, mutations, and
  transfer behavior.
- [Services API](api/services.md): service data model, contact modes,
  permissions, and mutations.
- [Minecraft Items API](api-mc-resolve.md): item resolution and caching.

## 🧩 External Integrations

- [MineVerify API](api/mineverify.md): server-plugin request lifecycle and
  authenticated callbacks.

When endpoint behavior changes, update both the general backend reference and
the relevant domain document.
