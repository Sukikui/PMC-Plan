# PMC Plan Backend API Documentation

## Base URL

```
http://localhost:3000/api
```

## Endpoints

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
- `from_place_id` (string, optional) - Source place ID from places.json
- `to_x` (number, optional) - Destination X coordinate
- `to_y` (number, optional) - Destination Y coordinate
- `to_z` (number, optional) - Destination Z coordinate
- `to_world` (string, optional) - Destination world (`overworld` or `nether`, default: `overworld`)
- `to_place_id` (string, optional) - Destination place ID from places.json

#### Key Functions Used
- **`route.ts` (Handler):**
    - `parseQueryParams()` in `app/api/utils/api-utils.ts`
    - `handleError()` in `app/api/utils/api-utils.ts`
    - `normalizeWorldName()` in `lib/world-utils.ts`
    - `loadPlaces()` in `app/api/utils/shared.ts`
    - `loadPortals()` in `app/api/utils/shared.ts`
    - `RouteService` class in `app/api/route/route-service.ts`
- **`route-service.ts` (Service):**
    - `RouteService` constructor is initialized with `places` and `portals`.
    - `callNearestPortals()` in `app/api/route/route-utils.ts`
    - `callLinkedPortal()` in `app/api/route/route-utils.ts`
    - `calculateNetherAddress()` in `app/api/utils/shared.ts`
    - `calculateNetherNetworkDistance()` in `app/api/route/route-utils.ts`

**Note:** You must provide either coordinates (`x`, `y`, `z`) or `place_id` for both source and destination.

#### Internal Logic

- **`Overworld to Overworld`** Compares direct route vs nether route, chooses optimal
- **`Nether to Nether`** Uses nether network transport with address calculation
- **`Overworld to Nether`** Finds nearest portal and calculates route via nether
- **`Nether to Overworld`** Calculates route from Nether start to the Overworld portal nearest to the Overworld destination, then overworld transport to the final destination.
- Includes nether addresses for all nether positions
- Handles theoretical portal coordinates when linked portals don't exist

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
      "from": {"x": 1000, "y": 65, "z": -500},
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
      "from": {"x": -200, "y": 70, "z": 0},
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
      "distance": 600,
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
      }
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

### GET `/places`

Returns a list of all available places from the data files.

**Parameters:**
None

#### Key Functions Used
- `handleError()` in `app/api/utils/api-utils.ts`
- `loadPlaces()` in `app/api/utils/shared.ts`

**Response:**
```json
[
  {
    "id": "start_village",
    "name": "Village de Départ",
    "world": "overworld",
    "coordinates": {"x": -100, "y": 65, "z": -200},
    "tags": ["village", "spawn"],
    "description": "Point de départ pour tester le voyage via nether",
    "owner": "Notch",
    "discord": null
  },
  {
    "id": "end_city",
    "name": "Cité d'Arrivée",
    "world": "overworld",
    "coordinates": {"x": 4500, "y": 70, "z": 300},
    "tags": ["city", "destination"],
    "description": "Destination finale du voyage de test",
    "owner": null,
    "discord": "https://discord.gg/exemple123"
  }
]
```

**Examples:**
```bash
# Get all places
curl "http://localhost:3000/api/places"
```

---

### GET `/portals`

Returns a list of all available portals from the data files.

**Parameters:**
- `merge-nether-portals` (boolean, optional) - If `true`, links Overworld portals with their corresponding Nether portals by matching their `id`. The matched Nether portal is added as a `nether-associate` object to the Overworld portal, and the original Nether portal is removed from the list to avoid redundancy.

#### Key Functions Used
- `parseQueryParams()` in `app/api/utils/api-utils.ts`
- `handleError()` in `app/api/utils/api-utils.ts`
- `loadPortals()` in `app/api/utils/shared.ts`
- `callLinkedPortal()` in `app/api/route/route-utils.ts` (only in merge mode)
- `calculateNetherAddress()` in `app/api/utils/shared.ts` (only in merge mode)

#### Internal Logic

- **Default Mode**: Returns a raw list of all portals from data files.
- **Merge Mode (`merge-nether-portals=true`)**:
    - For each Overworld portal, it attempts to find a corresponding Nether portal.
    - An Overworld portal is associated with a Nether portal only if **both** of these conditions are met:
        1.  They share the **same `id`**.
        2.  The Nether portal is the "official" linked portal according to Minecraft's mechanics (verified using the `/api/linked-portal` logic).
    - If an association is made, the Overworld portal is augmented with a `nether-associate` object. This object contains the associated Nether portal's `coordinates`, `address` (obtained via `/nether-address`), and `description`.
    - The associated Nether portal is then excluded from the main list to avoid redundancy.
    - Any Nether portals that do not have a matching and officially linked Overworld counterpart (i.e., unassociated Nether portals) are included in the final response as standalone entries.

**Response:**
```json
[
  {
    "id": "portal_village_start",
    "name": "Portail du Village",
    "world": "overworld",
    "coordinates": {"x": -120, "y": 65, "z": -220},
    "description": "Portail près du village de départ"
  },
  {
    "id": "portal_village_start",
    "name": "Portail du Village",
    "world": "nether",
    "coordinates": {"x": -15, "y": 70, "z": -28},
    "description": null,
    "address": "Ouest 2"
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