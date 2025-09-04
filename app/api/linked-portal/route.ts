import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { callLinkedPortal } from '../route/route-utils';

const QuerySchema = z.object({
  from_x: z.coerce.number(),
  from_y: z.coerce.number(),
  from_z: z.coerce.number(),
  from_world: z.enum(['overworld', 'nether']),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const { from_x, from_y, from_z, from_world } = QuerySchema.parse({
      from_x: searchParams.get('from_x'),
      from_y: searchParams.get('from_y'),
      from_z: searchParams.get('from_z'),
      from_world: searchParams.get('from_world'),
    });

    const linkedPortal = await callLinkedPortal(from_x, from_y, from_z, from_world);

    return NextResponse.json(linkedPortal);

  } catch (error) {
    console.error('Error finding linked portal:', error);
    return NextResponse.json(
      { error: 'Failed to find linked portal' },
      { status: 500 }
    );
  }
}