# PMC Plan Backend API Documentation

## Base URL

```
http://localhost:3000/api
```

## Endpoints

Domain-specific endpoint documentation:

- [Spaces API](api/spaces.md)
- [Services API](api/services.md)

Space responses include dynamically derived place and portal summaries and an
aggregate trade-offer count for their associated map entries. These summaries
expose ordered Minecraft owners without duplicating ownership, association, or
offer-count data in the database.

Services are autonomous managed content. They reuse map-entry management and
Minecraft ownership without being associated with a place, world, coordinate,
or space. Each service exposes a title and subtitle. Its contact is either
disabled, derived from the primary Discord manager, or stored as a custom
Discord URL. Optional payment metadata combines a Minecraft item identifier
with a short description and reuses the standard item-resolution pipeline.

### GET `/nether-address`

Calculates the nether address for a portal location based on X, Y, and Z coordinates.

**Parameters:**
- `x` (number) - X coordinate in the nether
- `y` (number) - Y coordinate in the nether
- `z` (number) - Z coordinate in the nether

#### Key Functions Used
- `parseQueryParams()` in `app/api/utils/api-utils.ts`
- `handleError()` in `app/api/utils/api-utils.ts`
- `calculateNetherAddress()` in `app/api/utils/shared.ts`

**Note on `direction` output field:** 
The `direction` field is included in the response only when the calculated distance
to the nearest axis stop is greater than 10 blocks.
If the location is very close to an axis stop (within 10 blocks),
a specific direction is not considered meaningful, and the `direction` field will be omitted.

**Response:**

*When nearest location is spawn:*
```json
{
  "address": "Spawn",
  "nearestStop": {
    "axis": "Spawn",
    "level": null,
    "coordinates": { "x": -20, "y": 70, "z": 29 },
    "distance": 12.5
  }
}
```

*When nearest location is an axis stop with direction:*
```json
{
  "address": "Nord 4 gauche",
  "nearestStop": {
    "axis": "Nord",
    "level": 4,
    "coordinates": { "x": -20, "y": 70, "z": -175 },
    "distance": 21.21
  },
  "direction": "gauche"
}
```

*When nearest location is an axis stop without direction:*
```json
{
  "address": "Nord 4",
  "nearestStop": {
    "axis": "Nord",
    "level": 4,
    "coordinates": { "x": -20, "y": 70, "z": -175 },
    "distance": 8.5
  }
}
```

**Examples:**
```bash
curl "http://localhost:3000/api/nether-address?x=-35&y=70&z=-160"
```

---

### GET `/nearest-portals`

Finds nearest portals from a location, ordered by distance.

**Parameters:**
- `x` (number) - X coordinate of location
- `y` (number) - Y coordinate of location
- `z` (number) - Z coordinate of location
- `max_distance` (number, optional) - Maximum distance filter in blocks
- `world` (string, optional) - World to search in (`overworld` or `nether`, default: `overworld`)

#### Key Functions Used
- `parseQueryParams()` in `app/api/utils/api-utils.ts`
- `handleError()` in `app/api/utils/api-utils.ts`
- `findNearestPortals()` in `app/api/utils/shared.ts`

**Response:**
```json
[
  {
    "id": "portal_spawn",
    "name": "Spawn Portal",
    "world": "overworld",
    "coordinates": { "x": 950, "y": 65, "z": -480 },
    "description": "Main spawn portal",
    "distance": 125.3
  },
  {
    "id": "portal_base1",
    "name": "Base Portal",
    "world": "overworld",
    "coordinates": { "x": 1200, "y": 70, "z": -300 },
    "description": "Community base portal",
    "distance": 287.1
  }
]
```

**Examples:**
```bash
# Find all overworld portals near location, sorted by distance
curl "http://localhost:3000/api/nearest-portals?x=1000&y=65&z=-500"

# Find only portals within 500 blocks
curl "http://localhost:3000/api/nearest-portals?x=1000&y=65&z=-500&max_distance=500"

# Find nearest nether portals
curl "http://localhost:3000/api/nearest-portals?x=120&y=70&z=-60&world=nether"
```

---

### GET `/linked-portal`

Finds the linked portal in the opposite dimension using Minecraft's 8:1 conversion ratio.

**Parameters:**
- `from_x` (number) - X coordinate of source portal
- `from_y` (number) - Y coordinate of source portal
- `from_z` (number) - Z coordinate of source portal
- `from_world` (string) - World of the source portal (`overworld` or `nether`)

#### Key Functions Used
- `parseQueryParams()` in `app/api/utils/api-utils.ts`
- `handleError()` in `app/api/utils/api-utils.ts`
- `callLinkedPortal()` in `app/api/route/route-utils.ts`

**Response:**

*When linked portal found:*
```json
{
  "id": "example_portal_nether",
  "name": "Example Portal (Nether)",
  "world": "nether",
  "coordinates": { "x": 119, "y": 65, "z": -60 },
  "description": "The nether side of the example portal",
  "distance": 12.3
}
```

*When no linked portal found:*
```json
null
```

**Logic:**
- Converts coordinates using 8:1 ratio
- Search area depends on target dimension (2D filtering on X,Z only):
    - **Overworld portals**: 256x256 block area (±128 blocks)
    - **Nether portals**: 32x32 block area (±16 blocks)
- **Distance calculation**: Uses 3D euclidean distance (X,Y,Z) to find nearest portal among candidates
- Returns nearest portal if multiple found in search area
- **Theoretical Portal Coordinates**: When a linked portal doesn't exist, theoretical Nether coordinates are calculated.

**Examples:**
```bash
# Find nether portal linked to overworld portal at (950, 65, -480)  
curl "http://localhost:3000/api/linked-portal?from_x=950&from_y=65&from_z=-480&from_world=overworld"

# Find overworld portal linked to nether portal at (119, 65, -60)
curl "http://localhost:3000/api/linked-portal?from_x=119&from_y=65&from_z=-60&from_world=nether"
```

---

### GET `/route`

Calculates the optimal route between two locations using the full routing algorithm. Supports both coordinate and place ID inputs.

**Parameters:**
- `from_x` (number, optional) - Source X coordinate
- `from_y` (number, optional) - Source Y coordinate
- `from_z` (number, optional) - Source Z coordinate
- `from_world` (string, optional) - Source world (`overworld` or `nether`, default: `overworld`)
- `from_place_id` (string, optional) - Source place ID stored in Prisma
- `to_x` (number, optional) - Destination X coordinate
- `to_y` (number, optional) - Destination Y coordinate
- `to_z` (number, optional) - Destination Z coordinate
- `to_world` (string, optional) - Destination world (`overworld` or `nether`, default: `overworld`)
- `to_place_id` (string, optional) - Destination place ID stored in Prisma

#### Key Functions Used
- **`route.ts` (Handler):**
    - `parseQueryParams()` in `app/api/utils/api-utils.ts`
    - `handleError()` in `app/api/utils/api-utils.ts`
    - `normalizeWorldName()` in `lib/world-utils.ts`
    - `loadRouteData()` in `app/api/route/service/route-data.ts`
    - `RouteService` class in `app/api/route/service/route-service.ts`
- **`route-service.ts` (Service):**
    - `RouteService` constructor is initialized with `portals`.
    - `callNearestPortal()` in `app/api/route/route-utils.ts`
    - `callLinkedPortal()` in `app/api/route/route-utils.ts`
    - `calculateEuclideanDistance()` in `app/api/utils/shared.ts`
- **Nether network:**
    - Validated axis data and shared polylines in `lib/nether/network-data.ts`
    - Projection, graph construction, and shortest-path calculation in `lib/nether/routing.ts`

**Note:** You must provide either coordinates (`x`, `y`, `z`) or `place_id` for both source and destination.

#### Internal Logic

- Route data uses a dedicated projection containing only identifiers, worlds,
  coordinates, addresses, and portal pairing identities. It does not load
  images, trade offers, spaces, owners, managers, or editor metadata.
- Place and portal projections are queried concurrently and cached for up to
  60 seconds in the Next.js data cache. Successful place and portal mutations
  invalidate the shared cache immediately.
- Nearest and linked portal searches scan the projected portal collection once
  and retain only the best candidate, without sorting or copying the complete
  collection.

- **`Overworld to Overworld`**: 
  1. Calculates direct euclidean distance.
  2. Searches for portals within `directDistance` radius from start and end points.
  3. For each route option, finds linked nether portals (or calculates theoretical coordinates).
  4. Calculates total nether route distance: `distanceToPortal1 + netherDistance + distanceFromPortal2`. The Nether portion follows the axis-routing logic described below.
  5. **Decision rule**: `if (totalNetherDistance < directDistance)` → nether route, else direct route.
  6. Falls back to direct route if: no portals found, or no linked nether portal at destination.

- **`Nether to Nether`**: Calculates a route between both points using the Nether axis network when beneficial.
- **`Overworld to Nether`**: Finds the nearest overworld portal, links to the Nether, then routes from the Nether portal to the destination using the axis network when beneficial.
- **`Nether to Overworld`**: Routes from the start point to the destination's linked Nether portal using the axis network when beneficial, then crosses to the Overworld.
- **Nether axis routing**:
  1. The axis JSON is validated with Zod and converted into the same radial and ring polylines used by the map renderer.
  2. Each route endpoint is projected onto the nearest axis segment, including projections inside a segment rather than only at known stops.
  3. The two selected segments are temporarily split at their projections and connected to the actual route endpoints.
  4. Dijkstra's algorithm finds the shortest route through radial axes and level rings.
  5. Connector distances between actual endpoints and their projections are included in the route distance.
  6. The direct route is retained only when `directDistance * 2 <= axisRouteDistance`; otherwise, the route follows the axes.
  7. Invalid or disconnected network data falls back to the direct route.
- Nether route points expose an `address` whenever their Nether address is known or can be computed. This includes Nether portals, Nether places, theoretical portal coordinates, and raw Nether coordinate inputs.
- Stored Nether addresses are read from the database first. If a Nether point has no stored address, the route resolver computes one from its coordinates.
- Handles theoretical portal coordinates when linked portals don't exist (8:1 conversion)
- Every step endpoint uses the same location structure. Coordinates are always
  nested under `from.coordinates` and `to.coordinates`; bare coordinate objects
  are not returned as step endpoints.
- Every `nether_transport` step includes a `path` array containing the complete route geometry from `from.coordinates` to `to.coordinates`. Clients that do not use this optional field remain compatible with the existing step structure.

**Response:**

*Route with direct overworld transport:*
```json
{
  "player_from": {
    "coordinates": {"x": 1000, "y": 65, "z": -500},
    "world": "overworld"
  },
  "total_distance": 361.2,
  "steps": [
    {
      "type": "overworld_transport",
      "distance": 361.2,
      "from": {
        "name": "Position de départ",
        "coordinates": {"x": 1000, "y": 65, "z": -500}
      },
      "to": {
        "id": "village_commerce",
        "name": "Village Commerce",
        "coordinates": {"x": 1200, "y": 70, "z": -300}
      }
    }
  ]
}
```

*Route via nether with multiple steps:*
```json
{
  "player_from": {
    "coordinates": {"x": -200, "y": 70, "z": 0},
    "world": "overworld"
  },
  "total_distance": 1323.7269871905,
  "steps": [
    {
      "type": "overworld_transport",
      "distance": 243.310501211929,
      "from": {
        "name": "Position de départ",
        "coordinates": {"x": -200, "y": 70, "z": 0}
      },
      "to": {
        "id": "portail_spawn",
        "name": "Portail du Spawn",
        "coordinates": {"x": -160, "y": 70, "z": 240}
      }
    },
    {
      "type": "portal",
      "from": {
        "id": "portail_spawn",
        "name": "Portail du Spawn",
        "coordinates": {"x": -160, "y": 70, "z": 240},
        "world": "overworld"
      },
      "to": {
        "id": "portail_spawn",
        "name": "Portail du Spawn",
        "coordinates": {"x": -20, "y": 70, "z": 29},
        "world": "nether",
        "address": "Spawn"
      }
    },
    {
      "type": "nether_transport",
      "distance": 594.1803398875,
      "from": {
        "id": "portail_spawn",
        "name": "Portail du Spawn",
        "coordinates": {"x": -20, "y": 70, "z": 29},
        "address": "Spawn"
      },
      "to": {
        "id": "portail_village_suki",
        "name": "Portail du village de Suki",
        "coordinates": {"x": 563, "y": 60, "z": 34},
        "address": "Est 7 gauche"
      },
      "path": [
        {"x": -20, "y": 70, "z": 29},
        {"x": 15, "y": 70, "z": 29},
        {"x": 39, "y": 70, "z": 29},
        {"x": 81, "y": 70, "z": 29},
        {"x": 183, "y": 70, "z": 29},
        {"x": 279, "y": 70, "z": 29},
        {"x": 429, "y": 70, "z": 29},
        {"x": 563, "y": 70, "z": 29},
        {"x": 563, "y": 60, "z": 34}
      ]
    },
    {
      "type": "portal",
      "from": {
        "id": "portail_village_suki",
        "name": "Portail du village de Suki",
        "coordinates": {"x": 563, "y": 60, "z": 34},
        "world": "nether",
        "address": "Est 7 gauche"
      },
      "to": {
        "id": "portail_village_suki",
        "name": "Portail du village de Suki",
        "coordinates": {"x": 4520, "y": 70, "z": 280},
        "world": "overworld"
      }
    },
    {
      "type": "overworld_transport",
      "distance": 480.416485978573,
      "from": {
        "id": "portail_village_suki",
        "name": "Portail du village de Suki",
        "coordinates": {"x": 4520, "y": 70, "z": 280}
      },
      "to": {
        "id": "village_suki",
        "name": "Village de Suki",
        "coordinates": {"x": 5000, "y": 70, "z": 300}
      }
    }
  ]
}
```

**Examples:**
```bash
# Route using coordinates
curl "http://localhost:3000/api/route?from_x=1000&from_y=65&from_z=-500&to_x=1200&to_y=70&to_z=-300"

# Route using place IDs
curl "http://localhost:3000/api/route?from_place_id=spawn&to_place_id=village_commerce"

# Mixed coordinate and place ID
curl "http://localhost:3000/api/route?from_x=1000&from_y=65&from_z=-500&from_world=overworld&to_place_id=ferme_nether"

# Cross-dimensional routing
curl "http://localhost:3000/api/route?from_x=1000&from_y=65&from_z=-500&from_world=overworld&to_x=200&to_y=70&to_z=150&to_world=nether"
```

---

## Discord Authentication

Discord OAuth requests only the `identify` scope. PMC Plan never requests or
stores the user's email address. The returned Discord snowflake is the stable
external identifier; usernames remain editable display data and are not used
as database keys.

The OAuth callback upserts the application user by `discordId`, refreshes the
username, display name, and avatar URL, then stores the internal user ID and
role in the signed Auth.js JWT. Existing roles are never changed during a
subsequent login. The approval setting only determines the role assigned in
the create branch.

No Auth.js database adapter is used. Discord access and refresh tokens stay in
the transient OAuth callback and are discarded afterwards. PostgreSQL stores
only the internal user ID, Discord identity fields, role, creation date, and
application relations. The public session and API serializers keep exposing
the compact `name`, `username`, and `image` shape expected by the frontend.

---

## Account Approval and Content Authorization

New Discord accounts are stored with the `pending` role when manual approval is
enabled. Administrators can instead enable automatic approval, which assigns
the `user` role during account creation. Changing this setting never modifies
accounts that are already pending. Account approval is represented by the
single role transition `pending -> user`; there is no separate certification
field and places or portals no longer have individual approval statuses.

Content mutation permissions are:

- `pending`: read-only access.
- `user`: create content and update entries where they are the primary manager
  or a secondary manager.
- A secondary manager can edit content and public Minecraft owners, but cannot
  change the Discord team, transfer the primary role, or delete the entry.
- The primary manager can edit, manage the Discord team, transfer the primary
  role, and delete the entry.
- `admin` and `super_admin`: manage any content and team.

Each place has one `MapEntry`. Both endpoints of a linked portal share one
`MapEntry`. The `MapEntry.primaryManagerId` relation is the only primary
management source; creator history is not stored. `MapEntry.lastEditorId`
records the Discord account responsible for the latest content or management
mutation. Existing entries without an audit value fall back to their primary
manager when serialized.

Public owners are independent `MinecraftProfile` records referenced through
`MapEntryOwner`. They are display metadata and never grant write access.
Adding a Discord manager automatically suggests their linked Minecraft profile
as a public owner. That owner can then be removed without removing the manager.

The role stored in Prisma defines the maximum available permission level.
Administrators can explicitly enable debug mode, persisted in the
`pmc-plan-admin-debug` cookie. While it is enabled, the lower role selected
from the floating mode control is persisted in the `pmc-plan-admin-mode`
cookie. Every protected route uses the real role unless debug mode is active,
then derives an effective role from both cookies. The selected mode can only
reduce permissions and can never elevate a session, even if either cookie is
forged.

The Administration settings tab is the only client-side exception: it remains
available from the real administration role so the user can leave a lower
preview mode or disable debug mode. Its protected content and actions still
use the effective role. Disabling debug mode immediately restores the real
role and hides the floating mode control.

---

### GET `/admin/settings`

Returns the global application settings used by the Administration view. The
effective request role must be `admin` or `super_admin`.

**Internal logic:**
- Resolves the effective request role, including debug-mode restrictions.
- Reads the singleton `ApplicationSettings` record.
- Falls back to manual approval when the record has not been created yet.

**Response:**
```json
{
  "settings": {
    "automaticUserApproval": false
  }
}
```

---

### PATCH `/admin/settings`

Updates the global application settings. The effective request role must be
`admin` or `super_admin`.

**Body:**
```json
{
  "automaticUserApproval": true
}
```

**Internal logic:**
- Validates the complete settings payload with Zod.
- Upserts the singleton settings record.
- Applies the selected approval policy only to Discord accounts created after
  the update; existing pending accounts remain unchanged.

---

### GET `/admin/users`

Returns a paginated, read-only list of registered users for the settings
administration view. The authenticated session must have the `admin` or
`super_admin` role.

**Parameters:**
- `page` (integer, optional) - One-based page number. Defaults to `1`.
- `query` (string, optional) - Case-insensitive search across the displayed
  Discord and Minecraft identities, including the Discord fallback ID and the
  `Non lié` state. Discord usernames accept an optional leading `@`.
- `role` (`all`, `pending`, or `administrators`, optional) - Account role filter.
  `pending` returns accounts waiting for approval.
  `administrators` includes both `admin` and `super_admin`. Defaults to `all`.

**Internal logic:**
- Resolves the effective request role and rejects non-administration modes with
  `403`.
- Validates and normalizes query parameters with Zod.
- Reads users in reverse registration order with 7 records per page.
- Runs the page query and total count in one Prisma transaction.
- Returns only account summary fields; OAuth tokens are never persisted.

**Response:**
```json
{
  "users": [
    {
      "id": "user-id",
      "name": "Display name",
      "username": "discord_username",
      "image": "https://cdn.discordapp.com/avatar.png",
      "role": "user",
      "minecraftUuid": "7d2159e8-1051-4c3e-b504-c279cadd4273",
      "minecraftName": "_Suki_",
      "minecraftLinkedAt": "2026-07-25T12:00:00.000Z",
      "createdAt": "2026-06-01T12:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 6,
    "total": 1,
    "totalPages": 1
  }
}
```

---

### GET `/account/content`

Returns one paginated page of content managed by the authenticated Discord
user. The response uses the same summaries and ordering as the administration
content endpoint.

**Parameters:**
- `type` (`place`, `portal`, `space`, or `service`, required) - Content page.
- `page` (integer, optional) - One-based page number. Defaults to `1`.
- `query` (string, optional) - Case-insensitive search over the text displayed
  in each row. It also accepts the Discord username of any manager, with or
  without the leading `@`.
- `filter` (optional) - Accepts `all`; `overworld`, `nether`, or `linked` for
  places and portals; and `none`, `primary_manager`, or `custom` for services.

**Internal logic:**
- Requires an authenticated Discord session and returns `401` otherwise.
- Applies the authenticated user ID directly in PostgreSQL pagination.
- Includes content where the user is either the primary manager or one of the
  secondary managers.
- Reuses the administration query, serialization, filtering, six-item page
  size, and latest-update ordering.

**Response:**
```json
{
  "items": [],
  "pagination": {
    "page": 1,
    "pageSize": 6,
    "total": 0,
    "totalPages": 1
  }
}
```

---

### GET `/admin/content`

Returns one paginated administration page for places, portals, spaces, or
services. The authenticated session must have an effective `admin` or
`super_admin` role.

**Parameters:**
- `type` (`place`, `portal`, `space`, or `service`, required) - Content page.
- `page` (integer, optional) - One-based page number. Defaults to `1`.
- `query` (string, optional) - Case-insensitive search over the text displayed
  in each row. It also accepts the Discord username of any manager, with or
  without the leading `@`.
- `filter` (optional) - Accepts `all`; `overworld`, `nether`, or `linked` for
  places and portals; and `none`, `primary_manager`, or `custom` for services.
  `linked` selects portal map entries containing both worlds.

**Internal logic:**
- Resolves the effective request role and returns `403` outside an
  administration mode.
- Validates all query parameters with Zod.
- Reuses the shared content-management query without a manager restriction.
- Searches names and slugs, associated-space names where displayed, primary
  manager names, and Discord usernames for primary or secondary managers.
- Excludes hidden content fields and values already represented by filters.
- Paginates directly in PostgreSQL with 7 records per page and orders content
  by latest update.
- Queries places, portals, and services through their shared `MapEntry`, while
  spaces use their own management relation.
- Groups linked Overworld and Nether portals by immutable map-entry ID, so one
  logical portal always produces one administration row.
- Returns only list summaries: identity, context, primary manager, and
  secondary-manager count.

**Response:**
```json
{
  "items": [],
  "pagination": {
    "page": 1,
    "pageSize": 6,
    "total": 0,
    "totalPages": 1
  }
}
```

---

### PATCH `/admin/users/{id}/role`

Approves a pending account or changes administrator rights.

The endpoint accepts only `user` and `admin` as target roles:

- An `admin` or `super_admin` can approve `pending -> user`.
- Only a `super_admin` can promote `user -> admin` or demote `admin -> user`.
- Super-admin accounts cannot be created, modified, or demoted through the
  application; their role is managed directly in the database.

**Request:**
```json
{
  "role": "admin"
}
```

**Internal logic:**
- Resolves the effective request role and rejects non-administration modes with
  `403`.
- Validates the body with Zod and rejects unsupported roles with `400`.
- Returns `404` when the target user does not exist.
- Applies the role transition matrix and rejects unauthorized transitions with
  `403`.
- Updates the role through Prisma and returns the resulting user ID and role.
- Authentication refreshes roles from Prisma for existing JWT sessions, so
  promotions and demotions apply without requiring a new sign-in.

**Response:**
```json
{
  "user": {
    "id": "user-id",
    "role": "admin"
  }
}
```

---

### DELETE `/admin/users/{id}`

Permanently deletes a registered account from the administration settings.

**Optional request:**
```json
{
  "transferToUserId": "next-primary-manager-user-id"
}
```

`transferToUserId` is required only when the account remains the primary
manager of one or more map entries or spaces.

**Internal logic:**
- Resolves the effective request role and rejects non-administration modes with
  `403`.
- Allows an `admin` to delete `pending` and `user` accounts.
- Allows a `super_admin` to also delete `admin` accounts.
- Prevents administrators from deleting their own account.
- Prevents deleting a `super_admin` account through the application.
- Returns `404` when the target account does not exist.
- Runs map-entry and space reassignment with account deletion in one serializable
  transaction.
- Returns a structured `409` response when primary managed content exists and no
  transfer target was provided. The administration UI uses this response to
  open the Discord account selector.
- Validates that the transfer target is an approved account and is different
  from the deleted account.
- Removes the target from each secondary-manager relation before promoting it
  to primary manager.
- Adds the target's linked Minecraft profile as a public owner when it is not
  already present.
- Deletes against the previously read role to prevent a concurrent role change
  from bypassing the hierarchy.
- Deletes related Minecraft linking requests through Prisma cascading
  relations. Authentication has no separate account or session rows.
- Returns the updated management records for every affected map entry so the
  client can patch its caches without reloading the map.

**Response:**
```json
{
  "message": "Compte supprimé.",
  "transferredEntryCount": 2,
  "transferredSpaceCount": 1,
  "managementUpdates": []
}
```

**Transfer-required response:**
```json
{
  "error": "Un nouveau gestionnaire principal doit être sélectionné.",
  "code": "PRIMARY_MANAGEMENT_TRANSFER_REQUIRED",
  "primaryManagedContent": {
    "places": 2,
    "portals": 1,
    "spaces": 1
  }
}
```

---

## Map Entry Management

`MapEntry` centralizes permissions and public ownership for both places and
portals. Browser routes use the map-entry ID returned by `GET /places` and
`GET /portals`.

### GET `/map-entries/{id}/management`

Returns the complete management state to the primary manager, secondary
managers, or an administrator.

**Response:**
```json
{
  "access": {
    "mapEntryId": "map-entry-id",
    "primaryManagerId": "primary-user-id",
    "managerIds": ["secondary-user-id"]
  },
  "lastEditor": {
    "id": "editor-user-id",
    "name": "Display name",
    "username": "discord_username",
    "image": "https://cdn.discordapp.com/avatar.png",
    "editedAt": "2026-07-28T12:00:00.000Z"
  },
  "primaryManager": {
    "id": "primary-user-id",
    "name": "Display name",
    "username": "discord_username",
    "image": "https://cdn.discordapp.com/avatar.png",
    "role": "user",
    "minecraftProfile": {
      "uuid": "7d2159e8-1051-4c3e-b504-c279cadd4273",
      "name": "_Suki_"
    }
  },
  "managers": [],
  "owners": []
}
```

`lastEditor.editedAt` is the map entry audit timestamp. It is updated together
with the last editor for content, manager, owner, and primary manager changes.

Map-entry management has no independent mutation endpoint. The edit form keeps
content, managers, owners, and an optional primary-manager transfer in one
draft. `PUT /places/{slug}` and `PUT /portals/{slug}` persist that complete
draft through the same database transaction as the public content fields.

Managed content write payloads share the same text limits as the creation and
modification interface: names and slugs accept 40 characters, long
descriptions accept 2,000 characters, and short labels such as service
subtitles and payment terms accept 100 characters. Custom trade item names
accept 200 characters.

The update management object contains the desired final state:

```json
{
  "management": {
    "primaryManagerId": "primary-user-id",
    "managerIds": ["secondary-user-id"],
    "owners": [
      {
        "uuid": "7d2159e8-1051-4c3e-b504-c279cadd4273",
        "name": "_Suki_"
      }
    ],
    "excludedOwnerUuids": [],
    "transferConfirmation": "@next_primary_username"
  }
}
```

`transferConfirmation` is required only when `primaryManagerId` changes. It
must exactly match the target Discord username with its leading `@`.

**Internal logic:**
- Primary and secondary managers can replace the public owner list.
- Only the current primary manager or an administration role can change the
  Discord team or transfer primary management.
- Every desired manager must still be an approved account.
- Existing Minecraft UUIDs are read from the local profile table. A newly
  submitted profile is resolved through Mojang and its returned UUID must match
  the submitted UUID before it can be stored.
- Linked Minecraft profiles of desired managers are automatically included
  unless their UUID is explicitly listed in `excludedOwnerUuids`.
- Removing a Discord manager does not implicitly remove their Minecraft owner
  entry when that owner remains in the submitted final list.
- Manager and owner relations are replaced from the validated final state, and
  the authenticated actor becomes the last editor.

### GET `/users/search`

Searches approved Discord accounts by display name or username for the manager
picker. The query is case-insensitive and accepts usernames with or without
their leading `@`. Requires an authenticated, approved account and returns at
most eight results, including each user's optional linked Minecraft profile.

### POST `/minecraft/profiles/resolve`

Resolves a valid Minecraft player name to its canonical name and formatted
UUID. Requires an authenticated, approved account. It is used by the creation
and modification forms before the final place or portal transaction.

---

### GET `/places`

Returns all places stored in the Prisma-backed database. Content is immediately
visible because write access is granted at the user level instead of requiring
approval for each place.

**Parameters:**
None

#### Key Functions Used
- `handleError()` in `app/api/utils/api-utils.ts`
- `loadPlaces()` in `app/api/utils/shared.ts`

**Response:**
```json
[
  {
    "id": "village_suki",
    "name": "Village de Suki",
    "world": "overworld",
    "category": "construction",
    "coordinates": {"x": 5000, "y": 70, "z": 300},
    "address": null,
    "tags": ["village", "base"],
    "description": "Ancien village caché...",
    "images": [
      "https://cdn.example.com/village_suki.png",
      "https://cdn.example.com/village_suki_2.png"
    ],
    "owners": [
      {
        "uuid": "7d2159e8-1051-4c3e-b504-c279cadd4273",
        "name": "_Suki_"
      }
    ],
    "mapEntryId": "map-entry-id",
    "primaryManagerId": "user-id",
    "primaryManager": {
      "id": "user-id",
      "name": "Display name",
      "username": "discord_username",
      "image": "https://cdn.discordapp.com/avatar.png"
    },
    "managerIds": ["secondary-manager-id"],
    "space": {
      "id": "space-id",
      "slug": "quartier-central",
      "name": "Quartier central",
      "color": "#3B82F6",
      "logoUrl": "https://example.com/logo.png",
      "logoBackground": "color",
      "logoZoom": 1.5,
      "discordUrl": "https://discord.gg/quartier-central"
    },
    "lastEditor": {
      "id": "editor-user-id",
      "name": "Display name",
      "username": "discord_username",
      "image": "https://cdn.discordapp.com/avatar.png",
      "editedAt": "2026-07-28T12:00:00.000Z"
    },
    "discord": "https://discord.gg/exemple123",
    "discordOverride": null,
    "trade": [
      {
        "gives": {"item_id": "emerald", "quantity": 5, "enchanted": true},
        "wants": {"item_id": "diamond", "quantity": 1, "enchanted": false},
        "negotiable": false,
        "description": "Available while stocks last."
      }
    ]
  }
]
```

For places in the Nether, `address` contains the nearest Nether highway address when available. It is `null` for Overworld places.

`category` is the functional place category used by the interactive map icons. Allowed values are `construction`, `commerce`, `zone_communautaire`, and `ferme`. When omitted during creation or update, the API defaults it to `construction`.

Places can store up to 10 image URLs directly on the `Place.images` database field. Create and update payloads accept an `images` array; an empty or omitted array means the place has no image.

Trade offers accept an optional `description` of up to 2,000 characters. Empty or
whitespace-only values are stored as `null` and returned as `null` by `GET /places`.

Every place exposes its optional `space` summary. `discordOverride` is the
place-specific stored URL, while `discord` is the effective public URL:
`discordOverride`, then the associated space URL, then `null`.
`primaryManager` exposes the compact Discord identity already loaded with the
map entry; it does not require an additional user query. When the primary
manager's linked Minecraft profile is present in `owners`, read serialization
moves it to the first position while preserving the relative order of every
other owner.

**Examples:**
```bash
# Get all places
curl "http://localhost:3000/api/places"
```

---

### POST `/places`

Creates a place and its management resource.

**Internal logic:**
- Returns `401` without an authenticated session.
- Returns `403` when the authenticated account still has the `pending` role.
- Accepts `user`, `admin`, and `super_admin` roles.
- Creates one `MapEntry` with the session user as primary manager.
- Initializes the last editor with the primary manager.
- Accepts optional `management.managerIds`, `management.ownerNames`, and
  `management.excludedOwnerUuids`.
- Accepts an optional nullable `spaceId`. Attaching to a space requires the
  authenticated effective role to manage that space.
- Validates every selected Discord manager and resolves Minecraft owner names
  through Mojang before opening the database transaction.
- Automatically includes linked Minecraft profiles for selected managers unless
  their UUID is explicitly excluded by the creation form.
- Creates nested trade offers and items with the place.
- Makes the place immediately available through `GET /places`.

### PUT `/places/{slug}`

Updates a place. The primary manager, secondary managers, and administration
roles can edit it. The optional nullable `spaceId` changes or removes the
association. A non-null association to a different space requires management
access to the target space. The optional `management` object contains the
complete desired manager and owner state described under Map Entry Management.
Public fields, space association, management relations, and an optional primary
transfer are committed atomically. The update records the authenticated actor
as the last editor.

### DELETE `/places/{slug}`

Permanently deletes a place through its `MapEntry`. Only the primary manager
or an administration role can delete it. Database cascades delete the place,
trade offers, trade items, manager memberships, and public ownership links.

---

### GET `/portals`

Returns all portals stored in the database. Portals are immediately visible
because approval is handled at the account level.

**Parameters:**
- `merge-nether-portals` (boolean, optional) - If `true`, groups both
  endpoints of a linked portal through their shared `MapEntry`. The Nether
  endpoint is exposed through `nether-associate` on the Overworld endpoint.

#### Key Functions Used
- `parseQueryParams()` in `app/api/utils/api-utils.ts`
- `handleError()` in `app/api/utils/api-utils.ts`
- `loadPortals()` in `app/api/utils/shared/loaders.ts`
- `indexLinkedPortalPairs()` in `lib/portal/linked-portals.ts`
- `normalizeLinkedPortalIdentities()` in `lib/portal/linked-portals.ts`

#### Internal Logic

- **Shared identity normalization**:
    - A linked pair uses its Overworld endpoint as the canonical source for
      `id`, `slug`, and `name`.
    - Both endpoints expose that same identity, including in default mode.
      World-specific coordinates, descriptions, and addresses remain
      independent.
    - This read boundary also normalizes historical pairs whose duplicated
      database identity fields predate atomic pair updates.
- **Default Mode**: Returns one record per world after shared identity
  normalization.
- **Primary manager identity**: Every portal exposes the compact Discord
  identity already loaded with its map entry under `primaryManager`.
- **Owner ordering**: When the primary manager's linked Minecraft profile is
  present in `owners`, read serialization places it first without changing the
  relative order of the remaining owners.
- **Merge Mode (`merge-nether-portals=true`)**:
    - Groups portals by their immutable `mapEntryId`.
    - A group is linked when it contains one Overworld endpoint and one Nether
      endpoint.
    - If an association is made, the Overworld portal is augmented with a `nether-associate` object. This object contains the associated Nether portal's `coordinates`, `address` (read directly from the portal data), and `description`.
    - The associated Nether portal is then excluded from the main list to avoid redundancy.
    - Standalone portals remain independent, even if another portal happens to
      share their slug or be geographically close.

**Response:**
```json
[
  {
    "id": "portal_village_start",
    "name": "Portail du Village",
    "world": "overworld",
    "coordinates": {"x": -120, "y": 65, "z": -220},
    "description": "Portail près du village de départ",
    "nether-associate": {
      "coordinates": {"x": -15, "y": 70, "z": -28},
      "description": null,
      "address": "Ouest 2"
    },
    "mapEntryId": "map-entry-id",
    "primaryManagerId": "user-id",
    "primaryManager": {
      "id": "user-id",
      "name": "Display name",
      "username": "discord_username",
      "image": "https://cdn.discordapp.com/avatar.png"
    },
    "managerIds": ["secondary-manager-id"],
    "space": {
      "id": "space-id",
      "slug": "quartier-central",
      "name": "Quartier central",
      "color": "#3B82F6",
      "logoUrl": null,
      "logoBackground": "color",
      "logoZoom": 1,
      "discordUrl": "https://discord.gg/quartier-central"
    },
    "lastEditor": {
      "id": "editor-user-id",
      "name": "Display name",
      "username": "discord_username",
      "image": "https://cdn.discordapp.com/avatar.png",
      "editedAt": "2026-07-28T12:00:00.000Z"
    }
  },
  {
    "id": "portal_perdu_nether",
    "name": "Portail Perdu (Nether)",
    "world": "nether",
    "coordinates": {"x": 10, "y": 60, "z": 5},
    "description": "Un portail nether sans contrepartie overworld",
    "address": "Est 1"
  }
]
```

### POST `/portals`

Creates either one portal or an Overworld/Nether linked pair.

**Internal logic:**
- Returns `401` without an authenticated session.
- Returns `403` when the authenticated account still has the `pending` role.
- Accepts `user`, `admin`, and `super_admin` roles.
- Creates one `MapEntry` with the session user as primary manager.
- Initializes the last editor with the primary manager.
- Applies the same optional creation management payload as `POST /places`.
- Accepts the same optional nullable `spaceId` and target-space permission
  checks as `POST /places`.
- Creates linked portal pairs in one Prisma transaction.
- Both endpoints of a linked pair reference the same `MapEntry`.
- Makes created portals immediately available through `GET /portals`.

### PUT `/portals/{slug}`

Updates a single portal or a linked pair. The primary manager, secondary
managers, and administration roles can edit it. Both linked endpoints share the
same space association and last-editor audit through their common `MapEntry`.
For a linked payload, both endpoints are resolved through that `MapEntry` and
updated atomically by their immutable database IDs. Shared `name` and `slug`
values are updated once across the complete `MapEntry`; world-specific fields
are then updated on their respective endpoints. Renaming the pair therefore
cannot update only one world or break its logical identity. The optional
nullable `spaceId` follows the same rules as place updates. The optional
`management` object also follows the place update contract and is committed in
the same transaction as both portal endpoints.

### DELETE `/portals/{slug}`

Permanently deletes a single portal when `world` is provided, or the complete
linked pair when `world` is omitted. Every selected `MapEntry` must be owned
primarily by the authenticated user; administration roles can delete any pair.

**Examples:**
```bash
# Get all portals
curl "http://localhost:3000/api/portals"

# Get all portals and merge overworld portals with their nether associates
curl "http://localhost:3000/api/portals?merge-nether-portals=true"
```

**Response with `merge-nether-portals=true`:**
```json
[
  {
    "id": "portal_village_start",
    "name": "Portail du Village",
    "world": "overworld",
    "coordinates": {"x": -120, "y": 65, "z": -220},
    "description": "Portail près du village de départ",
    "nether-associate": {
      "coordinates": {"x": -15, "y": 70, "z": -28},
      "address": "Ouest 2",
      "description": null
    }
  },
  {
    "id": "portal_perdu_nether",
    "name": "Portail Perdu (Nether)",
    "world": "nether",
    "coordinates": {"x": 10, "y": 60, "z": 5},
    "description": "Un portail nether sans contrepartie overworld",
    "address": "Est 1"
  }
]
```
