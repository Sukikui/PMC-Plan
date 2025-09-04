import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { loadPortals } from '../utils/shared';
import { callLinkedPortal } from '../route/route-utils';
import { handleError, parseQueryParams } from '../utils/api-utils';

const QuerySchema = z.object({
  from_x: z.coerce.number(),
  from_y: z.coerce.number(),
  from_z: z.coerce.number(),
  from_world: z.enum(['overworld', 'nether']),
});

export async function GET(request: NextRequest) {
  try {
    const { from_x, from_y, from_z, from_world } = parseQueryParams(request.url, QuerySchema);

    const allPortals = await loadPortals();
    const linkedPortal = await callLinkedPortal(from_x, from_y, from_z, from_world, allPortals);

    return NextResponse.json(linkedPortal);

  } catch (error) {
    return handleError(error, 'Failed to find linked portal');
  }
}