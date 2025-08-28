import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { calculateNetherAddress } from '../utils/shared';

const QuerySchema = z.object({
  x: z.coerce.number(),
  y: z.coerce.number().optional(),
  z: z.coerce.number(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const { x, y, z } = QuerySchema.parse({
      x: searchParams.get('x'),
      y: searchParams.get('y') || undefined,
      z: searchParams.get('z'),
    });

    const netherAddress = await calculateNetherAddress(x, y || 70, z);

    if (netherAddress.error) {
      return NextResponse.json(
        { error: netherAddress.error },
        { status: 404 }
      );
    }

    return NextResponse.json(netherAddress);

  } catch (error) {
    console.error('Error calculating nether address:', error);
    return NextResponse.json(
      { error: 'Failed to calculate nether address' },
      { status: 500 }
    );
  }
}
