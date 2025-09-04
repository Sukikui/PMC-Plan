import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { findNearestPortals, loadPortals } from '../utils/shared';
import { handleError, parseQueryParams } from '../utils/api-utils';

const QuerySchema = z.object({
  x: z.coerce.number(),
  y: z.coerce.number(),
  z: z.coerce.number(),
  max_distance: z.coerce.number().optional(),
  world: z.enum(['overworld', 'nether']).default('overworld'),
});

export async function GET(request: NextRequest) {
  try {
    const { x, y, z, max_distance, world } = parseQueryParams(request.url, QuerySchema);

    const allPortals = await loadPortals();
    const nearestPortals = await findNearestPortals(x, y, z, world, allPortals, max_distance);

    return NextResponse.json(nearestPortals);
    
  } catch (error) {
    return handleError(error, 'Failed to find nearest portals');
  }
}
