import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { z } from 'zod';

const QuerySchema = z.object({
  x: z.coerce.number(),
  y: z.coerce.number(),
  z: z.coerce.number(),
  from_world: z.enum(['overworld', 'nether']),
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

function overworldToNether(x: number, z: number): { x: number; z: number } {
  return {
    x: Math.floor(x / 8),
    z: Math.floor(z / 8)
  };
}

function netherToOverworld(x: number, z: number): { x: number; z: number } {
  return {
    x: x * 8,
    z: z * 8
  };
}

function calculate3DDistance(x1: number, y1: number, z1: number, x2: number, y2: number, z2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dz = z2 - z1;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

function isInSearchCube(
  targetX: number, targetZ: number,
  portalX: number, portalZ: number,
  searchRadius: number
): boolean {
  const deltaX = Math.abs(portalX - targetX);
  const deltaZ = Math.abs(portalZ - targetZ);
  return deltaX <= searchRadius && deltaZ <= searchRadius;
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
    const { x, y, z, from_world } = QuerySchema.parse({
      x: searchParams.get('x'),
      y: searchParams.get('y'),
      z: searchParams.get('z'),
      from_world: searchParams.get('from_world'),
    });

    // Load all portals
    const allPortals = await loadPortals();
    
    // Determine target world, search coordinates, and search radius
    const targetWorld = from_world === 'overworld' ? 'nether' : 'overworld';
    const searchCoords = from_world === 'overworld' 
      ? overworldToNether(x, z)
      : netherToOverworld(x, z);
    
    // Search radius depends on target world: ±128 for overworld, ±16 for nether
    const searchRadius = targetWorld === 'overworld' ? 128 : 16;

    // Filter portals by target world
    const targetWorldPortals = allPortals.filter(portal => portal.world === targetWorld);
    
    if (targetWorldPortals.length === 0) {
      return NextResponse.json(null);
    }

    // Find portals in search cube and calculate distances
    const candidatePortals: PortalWithDistance[] = [];
    
    for (const portal of targetWorldPortals) {
      if (isInSearchCube(searchCoords.x, searchCoords.z, portal.coordinates.x, portal.coordinates.z, searchRadius)) {
        const distance = calculate3DDistance(
          searchCoords.x, y, searchCoords.z,
          portal.coordinates.x, portal.coordinates.y, portal.coordinates.z
        );
        candidatePortals.push({
          ...portal,
          distance
        });
      }
    }

    // If no portals in search cube, return null
    if (candidatePortals.length === 0) {
      return NextResponse.json(null);
    }

    // Find the nearest portal
    const linkedPortal = candidatePortals.reduce((nearest, current) => 
      current.distance < nearest.distance ? current : nearest
    );

    return NextResponse.json(linkedPortal);
    
  } catch (error) {
    console.error('Error finding linked portal:', error);
    return NextResponse.json(
      { error: 'Failed to find linked portal' },
      { status: 500 }
    );
  }
}