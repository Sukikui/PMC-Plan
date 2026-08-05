# Services API

Services describe work offered by Minecraft players independently from places,
portals, spaces, worlds, and route calculation. They are displayed in the
Services tab of the marketplace.

## Data Model

A service stores:

- A unique slug.
- A title.
- A required subtitle describing the service activity.
- One required long description.
- A contact mode: none, primary manager, or custom Discord URL.
- An optional Minecraft item identifier used as its illustration.
- An optional payment item and short payment description.
- One shared map entry containing Discord management and Minecraft providers.

The map entry is the canonical source for:

- The primary Discord manager.
- Secondary Discord managers.
- Ordered Minecraft owners, presented as providers in the interface.
- The latest Discord editor.

No service-specific management or provider tables exist. Adding a Discord
manager with a linked Minecraft account follows the common map-entry rule and
automatically adds that Minecraft profile to the provider list unless it was
explicitly excluded.

The illustration item identifier is metadata only. Item names and textures are
resolved by the existing Minecraft Items API when rendered.
The payment fields follow the same item-resolution path. They remain secondary
presentation metadata and do not introduce a payment title or transaction
system.

The primary-manager contact mode derives the public Discord profile URL from
the canonical map-entry manager. It does not duplicate a URL in the service.
Only the custom mode persists `contactDiscordUrl`; the other modes normalize it
to `null`.

## Permissions

- Public reads do not require authentication.
- Creation requires an approved effective role.
- The primary manager and secondary managers can edit a service.
- Only the primary manager can change the management team, transfer primary
  management, or delete the service.
- Effective `admin` and `super_admin` roles can perform every management
  action.
- Administration debug mode is respected by each protected endpoint.

## Public Service Shape

```json
{
  "id": "suksukredstone",
  "slug": "suksukredstone",
  "name": "SukSukRedstone",
  "subtitle": "Création de systèmes redstone",
  "description": "Conception et installation de systèmes sur mesure.",
  "contactType": "primary_manager",
  "contactDiscordUrl": null,
  "illustrationItemId": "minecraft:repeater",
  "paymentItemId": "minecraft:emerald",
  "paymentDescription": "Tarif selon la complexité du projet.",
  "mapEntryId": "map-entry-id",
  "primaryManagerId": "primary-user-id",
  "managerIds": ["secondary-user-id"],
  "owners": [
    {
      "uuid": "minecraft-profile-uuid",
      "name": "MinecraftName"
    }
  ],
  "primaryManager": {
    "id": "primary-user-id",
    "name": "Display name",
    "username": "discord_username",
    "image": "https://cdn.discordapp.com/avatar.png"
  },
  "lastEditor": {
    "id": "editor-user-id",
    "name": "Editor",
    "username": "editor_username",
    "image": null,
    "editedAt": "2026-07-30T12:00:00.000Z"
  },
  "createdAt": "2026-07-30T12:00:00.000Z",
  "updatedAt": "2026-07-30T12:00:00.000Z"
}
```

`id` currently mirrors the slug to remain consistent with other public content
shapes. `mapEntryId` is the stable management identifier.

## GET `/api/services`

Returns every service ordered by title.

The marketplace uses the paginated `view=summary` projection documented in
[Public Data Loading API](data-loading.md). Omitting `view` keeps this complete
collection contract available for compatibility.

**Response:**

```json
{
  "services": []
}
```

## GET `/api/services/{slug}`

Returns one complete service by slug. The response uses the same serialized
shape as the collection endpoint and returns `404` when the service does not
exist. This endpoint lets focused interfaces load an editor without fetching
the complete service collection.

**Response:**

```json
{
  "service": {}
}
```

## POST `/api/services`

Creates a service with the authenticated user as primary manager and latest
editor.

**Request:**

```json
{
  "slug": "suksukredstone",
  "name": "SukSukRedstone",
  "subtitle": "Création de systèmes redstone",
  "description": "Conception et installation de systèmes sur mesure.",
  "contactType": "primary_manager",
  "contactDiscordUrl": null,
  "illustrationItemId": "minecraft:repeater",
  "paymentItemId": "minecraft:emerald",
  "paymentDescription": "Tarif selon la complexité du projet.",
  "management": {
    "managerIds": ["secondary-user-id"],
    "ownerNames": ["MinecraftName"],
    "excludedOwnerUuids": []
  }
}
```

The subtitle and description must not be empty. `contactType` accepts `none`,
`primary_manager`, or `custom`. A valid `contactDiscordUrl` is required only
for `custom`; otherwise it is normalized to `null`. Optional illustration and
payment values are also normalized to `null`. The subtitle and payment
description are limited to 100 characters, while the long description is
limited to 2,000 characters. Manager IDs and provider profiles follow the common
map-entry validation and deduplication rules.

**Response:** `201` with `{ "service": ... }`.

## PUT `/api/services/{slug}`

Updates the public service fields and, when provided, its complete map-entry
management state.

**Request:**

```json
{
  "slug": "suksukredstone",
  "name": "SukSukRedstone",
  "subtitle": "Installation et maintenance redstone",
  "description": "Installation et maintenance de systèmes existants.",
  "contactType": "custom",
  "contactDiscordUrl": "https://discord.gg/example",
  "illustrationItemId": "minecraft:comparator",
  "paymentItemId": "minecraft:diamond",
  "paymentDescription": "Prix défini avant le début des travaux.",
  "management": {
    "managerIds": [],
    "owners": [
      {
        "uuid": "minecraft-profile-uuid",
        "name": "MinecraftName"
      }
    ],
    "excludedOwnerUuids": [],
    "primaryManagerId": "primary-user-id"
  }
}
```

The slug can change but must remain unique. A primary management transfer also
requires the common `transferConfirmation` value. The authenticated account is
recorded as the latest editor even when management is omitted.

**Response:** `200` with `{ "service": ... }`.

## DELETE `/api/services/{slug}`

Deletes the service through its map entry. Cascading relations remove the
service, secondary managers, and provider associations atomically.

This action is limited to the primary manager and effective administrators.

**Response:**

```json
{
  "message": "Service supprimé."
}
```

## Account Deletion

Services participate in the existing atomic primary-management transfer flow.
An account that primarily manages services cannot be deleted without a transfer
target. The conflict payload exposes a separate `services` count, while
`transferredEntryCount` continues to count every transferred map entry
regardless of its content type.
