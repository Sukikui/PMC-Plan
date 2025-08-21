import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { PortalWithDistance, loadPortals, calculateEuclideanDistance } from '../utils/shared';

const QuerySchema = z.object({
  x: z.coerce.number(),
  y: z.coerce.number().optional(),
  z: z.coerce.number(),
  max_distance: z.coerce.number().optional(),
  world: z.enum(['overworld', 'nether']).default('overworld'),
});

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
        distance: calculateEuclideanDistance(
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