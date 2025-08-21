import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { z } from 'zod';

const QuerySchema = z.object({
  x: z.coerce.number(),
  y: z.coerce.number().optional(),
  z: z.coerce.number(),
  max_distance: z.coerce.number().optional(),
  world: z.enum(['overworld', 'nether']).default('overworld'),
});

interface Portal {
  id: string;
  name: string;
  world: string;
  coordinates: {
    x: number;
    y: number;
    z: number;
  };
  description?: string;
}

interface PortalWithDistance {
  id: string;
  name: string;
  world: string;
  coordinates: {
    x: number;
    y: number;
    z: number;
  };
  description?: string;
  distance: number;
}

function calculateDistance(
  x1: number, y1: number, z1: number,
  x2: number, y2: number, z2: number
): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dz = z2 - z1;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

async function loadPortals(): Promise<Portal[]> {
  const portalsDir = path.join(process.cwd(), 'public', 'data', 'portals');
  
  try {
    const files = await fs.readdir(portalsDir);
    const jsonFiles = files.filter(file => file.endsWith('.json'));
    
    const portals: Portal[] = [];
    
    for (const file of jsonFiles) {
      try {
        const filePath = path.join(portalsDir, file);
        const content = await fs.readFile(filePath, 'utf-8');
        const portal: Portal = JSON.parse(content);
        portals.push(portal);
      } catch (error) {
        console.warn(`Failed to load portal file ${file}:`, error);
      }
    }
    
    return portals;
  } catch (error) {
    console.warn('Failed to load portals directory:', error);
    return [];
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const { x, y = 70, z, max_distance, world } = QuerySchema.parse({
      x: searchParams.get('x'),
      y: searchParams.get('y') || undefined,
      z: searchParams.get('z'),
      max_distance: searchParams.get('max_distance') || undefined,
      world: searchParams.get('world') || 'overworld',
    });

    // Load all portals
    const allPortals = await loadPortals();
    
    // Filter portals by world
    const worldPortals = allPortals.filter(portal => portal.world === world);
    
    if (worldPortals.length === 0) {
      return NextResponse.json([]);
    }

    // Calculate distances and create sorted list
    const portalsWithDistance: PortalWithDistance[] = worldPortals
      .map(portal => ({
        ...portal,
        distance: calculateDistance(
          x, y, z,
          portal.coordinates.x, portal.coordinates.y, portal.coordinates.z
        )
      }))
      .sort((a, b) => a.distance - b.distance); // Sort by distance (nearest first)

    // Filter by max_distance if provided
    const filteredPortals = max_distance 
      ? portalsWithDistance.filter(portal => portal.distance <= max_distance)
      : portalsWithDistance;

    return NextResponse.json(filteredPortals);
    
  } catch (error) {
    console.error('Error finding nearest portals:', error);
    return NextResponse.json(
      { error: 'Failed to find nearest portals' },
      { status: 500 }
    );
  }
}