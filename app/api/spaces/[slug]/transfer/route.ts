import { NextResponse } from 'next/server';
import { TransferSpaceSchema } from '@/lib/spaces/schemas';
import { transferSpace } from '@/lib/spaces/service';
import { invalidateSpacePublicData } from '@/lib/content/cache-tags';
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
    const space = await transferSpace(
      slug,
      actor,
      input.userId,
      input.confirmation,
    );
    invalidateSpacePublicData(slug);
    return NextResponse.json({ space });
  } catch (error) {
    return spaceErrorResponse(error);
  }
}
