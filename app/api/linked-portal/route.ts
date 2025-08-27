import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { PortalWithDistance, loadPortals, calculateEuclideanDistance, convertOverworldToNether, convertNetherToOverworld } from '../utils/shared';

const QuerySchema = z.object({
  from_x: z.coerce.number(),
  from_y: z.coerce.number(),
  from_z: z.coerce.number(),
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
    const { from_x, from_y, from_z, from_world } = QuerySchema.parse({
      from_x: searchParams.get('from_x'),
      from_y: searchParams.get('from_y'),
      from_z: searchParams.get('from_z'),
      from_world: searchParams.get('from_world'),
    });

    // Load all portals
    const allPortals = await loadPortals();
    
    // Determine target world, search coordinates, and search radius
    const targetWorld = from_world === 'overworld' ? 'nether' : 'overworld';
    const searchCoords = from_world === 'overworld' 
      ? convertOverworldToNether(from_x, from_z)
      : convertNetherToOverworld(from_x, from_z);
    
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
          searchCoords.x, from_y, searchCoords.z,
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
