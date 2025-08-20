# PMC Map

A Next.js application that provides intelligent pathfinding and navigation for Minecraft servers through the Nether hub network. Built with TypeScript, PixiJS for 2D mapping, and Zod for data validation.

## Features

- **Real-time Player Tracking**: Integrates with a localhost Minecraft mod to show your current position
- **Intelligent Pathfinding**: Uses A* algorithm to find optimal routes through the Nether tunnel network
- **Portal Management**: Automatically links Overworld ↔ Nether portals with 8:1 coordinate scaling
- **Interactive 2D Map**: PixiJS-powered map showing your location, destinations, and calculated routes
- **Flexible Data Structure**: JSON-based system for places, portals, and nether axes
- **Tag-based Filtering**: Organize and find destinations by categories (shop, farm, important, etc.)

## Project Structure

```
pmc-map/
├─ app/
│  ├─ page.tsx                      # Main UI (PixiJS canvas + controls)
│  └─ api/
│     ├─ places/route.ts            # GET /api/places (list places from JSON)
│     └─ route/route.ts             # GET /api/route (compute path)
├─ components/
│  ├─ Map2D.tsx                     # PixiJS scene (player, portals, path)
│  └─ Controls.tsx                  # UI controls (tags, destination picker)
├─ lib/
│  ├─ data.ts                       # Load & cache JSON data
│  ├─ schemas.ts                    # Zod schemas for type safety
│  ├─ coords.ts                     # OW↔Nether 8:1 conversions + distance
│  ├─ portals_linking.ts            # Auto match Overworld <-> Nether portals
│  ├─ nether_graph.ts               # Build graph from axes + portals
│  ├─ pathfind.ts                   # A* / Dijkstra pathfinding
│  └─ directions.ts                 # Generate readable navigation steps
├─ public/
│  └─ data/
│     ├─ portals/                   # One JSON per portal
│     ├─ places/                    # One JSON per place
│     └─ nether_axes.json           # Structured Nether axes (N, S, E, W, NE…)
└─ public/sprites/                  # Pixi assets (player, portal icons, etc.)
```

## API Endpoints

- `GET /api/places?tag=shop|event|...` → Array of places filtered by tag
- `GET /api/route?fromDim=...&fromX=...&fromY=...&fromZ=...&toId=...` → Path segments with distance calculations

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Minecraft mod that serves player position on `http://127.0.0.1:31337/position`

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

### Minecraft Integration

The app polls `http://127.0.0.1:31337/position` expecting JSON in this format:
```json
{
  "dim": "overworld|nether|end",
  "x": 123,
  "y": 64, 
  "z": 456,
  "ts": 1640995200
}
```

Your Minecraft mod server must allow CORS from your domain.

## Data Configuration

### Adding Places

Create JSON files in `public/data/places/`:
```json
{
  "id": "my_place",
  "name": "My Cool Place", 
  "world": "overworld",
  "coordinates": { "x": 100, "y": 64, "z": 200 },
  "tags": ["shop", "important"],
  "description": "A really cool place to visit",
}
```

### Adding Portals

Create paired JSON files in `public/data/portals/`:

Overworld portal:
```json
{
  "id": "my_portal_ow",
  "name": "My Portal (Overworld)",
  "world": "overworld",
  "coordinates": { "x": 800, "y": 64, "z": 1600 },
  "description": "Portal connecting to the nether"
}
```

Nether portal:
```json
{
  "id": "my_portal_nether", 
  "name": "My Portal (Nether)",
  "world": "nether",
  "coordinates": { "x": 100, "y": 64, "z": 200 },
  "description": "Nether side of the portal"
}
```

### Configuring Nether Axes

Edit `public/data/nether_axes.json` to define your tunnel network:
```json
{
  "axes": [
    {
      "id": "main_north",
      "name": "North Tunnel",
      "direction": "north", 
      "startCoordinates": { "x": 0, "y": 64, "z": -50 },
      "endCoordinates": { "x": 0, "y": 64, "z": -1000 },
      "tunnelWidth": 5,
      "isMainAxis": true
    }
  ]
}
```

## Development

### Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production  
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript compiler

### Tech Stack

- **Next.js 14**: React framework with App Router
- **TypeScript**: Type safety and better developer experience
- **PixiJS**: High-performance 2D graphics for the interactive map
- **Zod**: Runtime type validation for API inputs and data files
- **Tailwind CSS**: Utility-first CSS framework
- **A* Algorithm**: Pathfinding through the nether tunnel network

## Deployment

Deploy to Vercel (recommended):

1. Connect your GitHub repository to Vercel
2. Set the root directory to your repository root
3. Deploy - Vercel will automatically detect the Next.js configuration

The app will be available at your Vercel domain and can integrate with your Minecraft mod via CORS.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is MIT licensed.