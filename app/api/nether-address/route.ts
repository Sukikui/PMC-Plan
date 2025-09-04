import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { calculateNetherAddress } from '../utils/shared';
import { handleError, parseQueryParams } from '../utils/api-utils';

const QuerySchema = z.object({
  x: z.coerce.number(),
  y: z.coerce.number(),
  z: z.coerce.number(),
});

export async function GET(request: NextRequest) {
  try {
    const { x, y, z } = parseQueryParams(request.url, QuerySchema);

    const netherAddress = await calculateNetherAddress(x, y, z);

    if (netherAddress.error) {
      return NextResponse.json(
        { error: netherAddress.error },
        { status: 404 }
      );
    }

    return NextResponse.json(netherAddress);

  } catch (error) {
    return handleError(error, 'Failed to calculate nether address');
  }
}
