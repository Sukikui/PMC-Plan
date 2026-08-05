# Spaces API

Spaces are community entities that can group places and portals through their
shared map entry. Spaces remain independent from worlds, coordinates, and
route calculation.

## Data Model

A space stores:

- A unique slug.
- A display name and optional description.
- One canonical `#RRGGBB` color.
- An optional remote logo URL, circular crop zoom, and background mode.
- An optional Discord URL.
- One primary Discord manager.
- Zero or more secondary Discord managers.
- The Discord account responsible for the latest mutation.
- Zero or more associated map entries.
- A dynamic member list derived from the Minecraft owners of associated map
  entries.
- A dynamic image gallery derived from associated places.
- Dynamic place and portal summaries used by the space detail interface.
- A dynamic offer count derived from associated places.

Members are not stored independently. They are deduplicated by Minecraft UUID
and recomputed from every associated place and portal whenever a space is
returned. Gallery images are also not stored on the space: they retain the
identifier, slug, and name of their source place. The offer count is not
stored either; it is computed from the trade offers of every associated place.

Place and portal summaries are also computed from associated map entries. They
contain the public content identity, world metadata, and ordered Minecraft
owners. When the primary Discord manager has a linked Minecraft profile present
among the owners, that profile is returned first. Remaining owners keep their
configured order. Linked Overworld and Nether portals produce one canonical
portal summary.

The logo and Discord URLs are metadata only. The application does not upload
or proxy the logo image. The client accepts PNG, JPEG, and WebP images and
always renders them inside the same colored circle used by the fallback
monogram. `logoZoom` ranges from `1` to `3`; at `1`, the complete image fits
inside the circle, while higher values progressively crop it.
`logoBackground` is either `color`, which uses the space color, or
`transparent`. The background mode only applies to a valid image; the fallback
monogram always retains the space color. The fallback is used when the logo URL
is absent or cannot be rendered. The optional Discord URL is limited to 256
characters.

## Permissions

- Public reads do not require authentication.
- Creation requires an approved effective role.
- The primary manager and secondary managers can edit public space data.
- Only the primary manager can change the management team, transfer primary
  management, or delete the space.
- Effective `admin` and `super_admin` roles can perform all management actions.
- Administration debug mode is respected by every protected endpoint.
- Associating a place or portal with a new space requires management access to
  both the map content and the target space.

## Public Space Shape

```json
{
  "id": "space-id",
  "slug": "quartier-central",
  "name": "Quartier central",
  "description": "Centre commercial communautaire.",
  "color": "#3B82F6",
  "logoUrl": "https://example.com/logo.png",
  "logoBackground": "color",
  "logoZoom": 1.5,
  "discordUrl": "https://discord.gg/quartier-central",
  "offerCount": 4,
  "images": [
    {
      "id": "place-id-0",
      "url": "https://example.com/place.png",
      "placeId": "place-id",
      "placeSlug": "place-centrale",
      "placeName": "Place centrale"
    }
  ],
  "places": [
    {
      "category": "construction",
      "mapEntryId": "map-entry-id",
      "name": "Place centrale",
      "owners": [
        {
          "uuid": "minecraft-profile-uuid",
          "name": "MinecraftName"
        }
      ],
      "slug": "place-centrale",
      "world": "overworld"
    }
  ],
  "portals": [
    {
      "linked": true,
      "mapEntryId": "portal-map-entry-id",
      "name": "Portail central",
      "owners": [],
      "slug": "portail-central",
      "world": "overworld"
    }
  ],
  "members": [
    {
      "uuid": "minecraft-profile-uuid",
      "name": "MinecraftName"
    }
  ],
  "primaryManagerId": "primary-user-id",
  "managerIds": ["secondary-user-id"],
  "primaryManager": {
    "id": "primary-user-id",
    "name": "Display name",
    "username": "discord_username",
    "image": "https://cdn.discordapp.com/avatar.png",
    "role": "user"
  },
  "managers": [
    {
      "id": "secondary-user-id",
      "name": "Secondary manager",
      "username": "secondary_username",
      "image": null,
      "role": "user"
    }
  ],
  "lastEditor": {
    "id": "editor-user-id",
    "name": "Editor",
    "username": "editor_username",
    "image": null,
    "editedAt": "2026-07-29T12:00:00.000Z"
  },
  "createdAt": "2026-07-29T12:00:00.000Z",
  "updatedAt": "2026-07-29T12:00:00.000Z"
}
```

## GET `/api/spaces`

Returns every space ordered by name.

The public application uses the lighter collection views documented in
[Public Data Loading API](data-loading.md): `view=summary` for paginated space
exploration and `view=reference` for authenticated form selectors. Omitting
`view` keeps this complete collection contract available for compatibility.

**Response:**

```json
{
  "spaces": []
}
```

## POST `/api/spaces`

Creates a space with the authenticated user as primary manager and last
editor.

**Request:**

```json
{
  "slug": "quartier-central",
  "name": "Quartier central",
  "description": "Centre commercial communautaire.",
  "discordUrl": "https://discord.gg/quartier-central",
  "color": "#3B82F6",
  "logoUrl": "https://example.com/logo.png",
  "logoBackground": "transparent",
  "logoZoom": 1.5,
  "managerIds": ["secondary-user-id"]
}
```

The slug is validated but generated by the application interface. Manager IDs
are deduplicated, the primary manager is excluded from the secondary list, and
every selected account must be approved.

**Response:** `201` with `{ "space": ... }`.

## GET `/api/spaces/{slug}`

Returns one public space or `404` when the slug does not exist.

## PUT `/api/spaces/{slug}`

Updates a space, including its slug when needed.

**Request:**

```json
{
  "slug": "nouveau-quartier-central",
  "name": "Quartier central",
  "description": null,
  "discordUrl": null,
  "color": "#10B981",
  "logoUrl": null,
  "logoBackground": "color",
  "logoZoom": 1,
  "managerIds": []
}
```

For a secondary manager, public fields are updated but `managerIds` is ignored.
For a primary manager or administrator, `managerIds` replaces the complete
secondary manager list. The new slug must remain unique. The authenticated
account becomes the last editor.

## DELETE `/api/spaces/{slug}`

Deletes the space. This action is limited to the primary manager and effective
administrators. Associated map entries are preserved and become unassociated.

**Response:**

```json
{
  "message": "Espace supprimé."
}
```

## POST `/api/spaces/{slug}/transfer`

Transfers primary management to another approved Discord account.

**Request:**

```json
{
  "userId": "next-primary-user-id",
  "confirmation": "@next_primary_username"
}
```

The confirmation must exactly match the target Discord username prefixed with
`@`. The target is removed from secondary management, while the previous
primary manager becomes a secondary manager.

## Account Deletion

Account deletion includes spaces in the existing atomic transfer workflow. A
user who remains the primary manager of spaces cannot be deleted without a
transfer target. The response exposes a separate `spaces` count and
`transferredSpaceCount`; secondary management and last-editor relations are
cleaned by their Prisma referential actions.
