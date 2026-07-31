import { NextResponse } from 'next/server';
import { TransferSpaceSchema } from '@/lib/spaces/schemas';
import { transferSpace } from '@/lib/spaces/service';
import {
  getSpaceActor,
  spaceErrorResponse,
} from '../../route-utils';

interface RouteContext {
  params: Promise<{ slug: string }>;
}

export async function POST(request: Request, context: RouteContext) {
  const actor = await getSpaceActor(request);
  if (!actor) {
    return NextResponse.json(
      { error: 'Authentification requise.' },
      { status: 401 },
    );
  }

  try {
    const { slug } = await context.params;
    const input = TransferSpaceSchema.parse(await request.json());
    return NextResponse.json({
      space: await transferSpace(
        slug,
        actor,
        input.userId,
        input.confirmation,
      ),
    });
  } catch (error) {
    return spaceErrorResponse(error);
  }
}
