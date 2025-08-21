# PMC Map Backend API Documentation

## Base URL

```
http://localhost:3000/api
```

## Endpoints

### GET `/nether-address`

Calculates the nether address for a portal location based on X and Z coordinates.

**Parameters:**
- `x` (number) - X coordinate in the nether
- `y` (number, optional) - Y coordinate in the nether (for future use)
- `z` (number) - Z coordinate in the nether

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
curl "http://localhost:3000/api/nether-address?x=-35&z=-160"
```

---

### GET `/nearest-portals`

Finds nearest portals from a location, ordered by distance.

**Parameters:**
- `x` (number) - X coordinate of location
- `y` (number, optional) - Y coordinate of location (default: 70)
- `z` (number) - Z coordinate of location
- `max_distance` (number, optional) - Maximum distance filter in blocks
- `world` (string, optional) - World to search in (`overworld` or `nether`, default: `overworld`)

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
curl "http://localhost:3000/api/nearest-portals?x=1000&z=-500"

# Find only portals within 500 blocks
curl "http://localhost:3000/api/nearest-portals?x=1000&z=-500&max_distance=500"

# Find nearest nether portals
curl "http://localhost:3000/api/nearest-portals?x=120&z=-60&world=nether"
```

---

### GET `/linked-portal`

Finds the linked portal in the opposite dimension using Minecraft's 8:1 conversion ratio.

**Parameters:**
- `x` (number) - X coordinate of source portal
- `y` (number) - Y coordinate of source portal  
- `z` (number) - Z coordinate of source portal
- `from_world` (string) - World of the source portal (`overworld` or `nether`)

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
- Search area depends on target dimension:
  - **Overworld portals**: 256x256 block area (±128 blocks)
  - **Nether portals**: 32x32 block area (±16 blocks)
- Y coordinate ignored for search area determination (height doesn't matter for cube)
- **Distance calculation**: Uses 3D euclidean distance (X,Y,Z) to find nearest portal
- Returns nearest portal if multiple found in search area

**Examples:**
```bash
# Find nether portal linked to overworld portal at (950, 65, -480)  
curl "http://localhost:3000/api/linked-portal?x=950&y=65&z=-480&from_world=overworld"

# Find overworld portal linked to nether portal at (119, 65, -60)
curl "http://localhost:3000/api/linked-portal?x=119&y=65&z=-60&from_world=nether"
```

---

### GET `/route`

Calculates the optimal route between two locations using the full routing algorithm. Supports both coordinate and place ID inputs.

**Parameters:**
- `from_x` (number, optional) - Source X coordinate
- `from_y` (number, optional) - Source Y coordinate (default: 70)
- `from_z` (number, optional) - Source Z coordinate
- `from_world` (string, optional) - Source world (`overworld` or `nether`, default: `overworld`)
- `from_place_id` (string, optional) - Source place ID from places.json
- `to_x` (number, optional) - Destination X coordinate
- `to_y` (number, optional) - Destination Y coordinate (default: 70)
- `to_z` (number, optional) - Destination Z coordinate
- `to_world` (string, optional) - Destination world (`overworld` or `nether`, default: `overworld`)
- `to_place_id` (string, optional) - Destination place ID from places.json

**Note:** You must provide either coordinates (`x`, `z`) or `place_id` for both source and destination.

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
    "coordinates": {"x": 1000, "y": 65, "z": -500},
    "world": "overworld"
  },
  "total_distance": 298.5,
  "steps": [
    {
      "type": "overworld_transport",
      "distance": 125.3,
      "from": {"x": 1000, "y": 65, "z": -500},
      "to": {
        "id": "portal_spawn",
        "name": "Portail Spawn",
        "coordinates": {"x": 950, "y": 65, "z": -480}
      }
    },
    {
      "type": "portal",
      "from": {
        "id": "portal_spawn",
        "name": "Portail Spawn",
        "coordinates": {"x": 950, "y": 65, "z": -480},
        "world": "overworld"
      },
      "to": {
        "id": "portal_spawn_nether",
        "name": "Portail Spawn (Nether)",
        "coordinates": {"x": 119, "y": 65, "z": -60},
        "world": "nether",
        "address": "Nord 4 gauche"
      }
    },
    {
      "type": "nether_transport",
      "distance": 150.0,
      "from": {
        "id": "portal_spawn_nether",
        "coordinates": {"x": 119, "y": 65, "z": -60},
        "address": "Nord 4 gauche"
      },
      "to": {
        "id": "portal_base_nether",
        "coordinates": {"x": 150, "y": 65, "z": -38},
        "address": "Sud 2"
      }
    },
    {
      "type": "portal",
      "from": {
        "id": "portal_base_nether",
        "name": "Portail Base (Nether)",
        "coordinates": {"x": 150, "y": 65, "z": -38},
        "world": "nether",
        "address": "Sud 2"
      },
      "to": {
        "id": "portal_base",
        "name": "Portail Base",
        "coordinates": {"x": 1200, "y": 70, "z": -300},
        "world": "overworld"
      }
    },
    {
      "type": "overworld_transport",
      "distance": 23.2,
      "from": {
        "id": "portal_base",
        "name": "Portail Base",
        "coordinates": {"x": 1200, "y": 70, "z": -300}
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

**Logic:**
- **Overworld to Overworld**: Compares direct route vs nether route, chooses optimal
- **Nether to Nether**: Uses nether network transport with address calculation
- **Overworld to Nether**: Finds nearest portal and calculates route via nether
- **Nether to Overworld**: Uses nether network to nearest portal, then overworld transport
- Includes nether addresses for all nether positions
- Handles theoretical portal coordinates when linked portals don't exist

**Examples:**
```bash
# Route using coordinates
curl "http://localhost:3000/api/route?from_x=1000&from_z=-500&to_x=1200&to_z=-300"

# Route using place IDs
curl "http://localhost:3000/api/route?from_place_id=spawn&to_place_id=village_commerce"

# Mixed coordinate and place ID
curl "http://localhost:3000/api/route?from_x=1000&from_z=-500&from_world=overworld&to_place_id=ferme_nether"

# Cross-dimensional routing
curl "http://localhost:3000/api/route?from_x=1000&from_z=-500&from_world=overworld&to_x=200&to_z=150&to_world=nether"
```

---

### GET `/places`

Returns a list of all available places from the data files.

**Parameters:**
None

**Response:**
```json
[
  {
    "id": "start_village",
    "name": "Village de Départ",
    "world": "overworld",
    "coordinates": {"x": -100, "y": 65, "z": -200},
    "tags": ["village", "spawn"],
    "description": "Point de départ pour tester le voyage via nether"
  },
  {
    "id": "end_city",
    "name": "Cité d'Arrivée",
    "world": "overworld",
    "coordinates": {"x": 4500, "y": 70, "z": 300},
    "tags": ["city", "destination"],
    "description": "Destination finale du voyage de test"
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
None

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
    "id": "portal_village_start_nether",
    "name": "Portail du Village (Nether)",
    "world": "nether",
    "coordinates": {"x": -15, "y": 70, "z": -28},
    "description": "Côté nether du portail du village, près de Nord-2-gauche"
  }
]
```

**Examples:**
```bash
# Get all portals
curl "http://localhost:3000/api/portals"
```