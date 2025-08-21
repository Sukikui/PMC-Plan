import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { PortalWithDistance, loadPortals, calculateEuclideanDistance, convertOverworldToNether, convertNetherToOverworld } from '../utils/shared';

const QuerySchema = z.object({
  x: z.coerce.number(),
  y: z.coerce.number(),
  z: z.coerce.number(),
  from_world: z.enum(['overworld', 'nether']),
});

function isInSearchCube(
  targetX: number, targetZ: number,
  portalX: number, portalZ: number,
  searchRadius: number
): boolean {
  const deltaX = Math.abs(portalX - targetX);
  const deltaZ = Math.abs(portalZ - targetZ);
  return deltaX <= searchRadius && deltaZ <= searchRadius;
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
      ? convertOverworldToNether(x, z)
      : convertNetherToOverworld(x, z);
    
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
        const distance = calculateEuclideanDistance(
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