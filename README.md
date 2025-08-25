# 🗺️ PMC Plan

**Smart route planning for Minecraft servers**

A web application that automatically calculates the best routes between destinations via the Nether portal network, with real-time synchronization of your player position.

## ✨ Features

- 🎯 **Smart navigation** - Automatic calculation of optimal routes via the Nether
- 🔄 **Real-time sync** - PlayerCoordsAPI mod integration for current position  
- 🌐 **Modern interface** - Clean design with interactive panels and notifications
- 📍 **Destination management** - Places and portals organized by tags with search
- 🚇 **Nether network** - Axis and address system for underground navigation

## 🚀 Quick start

### Installation

```bash
# Clone the repository
git clone https://github.com/Sukikui/PMC-Plan.git
# Install dependencies
npm install
# Launch in development
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Required Minecraft mod

Install [PlayerCoordsAPI](https://modrinth.com/mod/playercoordsapi) for automatic position synchronization.

## 📁 Project structure

```
PMC-Plan/
├── app/
│   ├── page.tsx              # Main interface
│   └── api/                  # Next.js API routes
│       ├── places/          # Places management
│       ├── portals/         # Portals management  
│       └── route/           # Route calculation
├── components/
│   ├── DestinationPanel.tsx # Left panel (destinations)
│   ├── PositionPanel.tsx    # Right panel (player position)
│   └── TravelPlan.tsx       # Central display (route)
├── public/data/
│   ├── places/              # Places JSON files
│   ├── portals/             # Portals JSON files
│   └── nether_axes.json     # Nether network configuration
└── lib/
    └── world-utils.ts       # World conversion utilities
```

## ⚙️ Configuration

### Add a place

Create `public/data/places/my_place.json`:
```json
{
  "id": "my_place",
  "name": "My Awesome Place",
  "world": "overworld", 
  "coordinates": { "x": 100, "y": 64, "z": 200 },
  "tags": ["shop", "important"],
  "description": "Place description"
}
```

### Add a portal

Create a pair of linked portals:

`public/data/portals/portal_ow.json`:
```json
{
  "id": "portal_ow",
  "name": "My Portal",
  "world": "overworld",
  "coordinates": { "x": 800, "y": 64, "z": 1600 }
}
```

`public/data/portals/portal_nether.json`:
```json
{
  "id": "portal_nether", 
  "name": "My Portal",
  "world": "nether",
  "coordinates": { "x": 100, "y": 64, "z": 200 }
}
```

## 🛠️ Development scripts

```bash
npm run dev         # Development server
npm run build       # Production build
npm run start       # Production server
npm run lint        # Code linting
npm run type-check  # TypeScript checking
npm test            # API tests
```

## 🏗️ Tech stack

- **Next.js 14** - React framework with App Router
- **TypeScript** - Static typing 
- **Tailwind CSS** - Utility-first CSS framework
- **Zod** - Schema validation
- **PlayerCoordsAPI** - Minecraft mod for synchronization