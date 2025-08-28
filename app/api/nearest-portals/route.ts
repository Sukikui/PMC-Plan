import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { findNearestPortals } from '../utils/shared';

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
    const { x, y, z, max_distance, world } = QuerySchema.parse({
      x: searchParams.get('x'),
      y: searchParams.get('y') || undefined,
      z: searchParams.get('z'),
      max_distance: searchParams.get('max_distance') || undefined,
      world: searchParams.get('world') || 'overworld',
    });

    const nearestPortals = await findNearestPortals(x, y, z, world, max_distance);

    return NextResponse.json(nearestPortals);
    
  } catch (error) {
    console.error('Error finding nearest portals:', error);
    return NextResponse.json(
      { error: 'Failed to find nearest portals' },
      { status: 500 }
    );
  }
}
