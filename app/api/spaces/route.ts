import { NextResponse } from 'next/server';
import { canContribute } from '@/lib/content-permissions';
import { CreateSpaceSchema } from '@/lib/spaces/schemas';
import { createSpace, listSpaces } from '@/lib/spaces/service';
import { getSpaceActor, spaceErrorResponse } from './route-utils';

export async function GET() {
  return NextResponse.json({ spaces: await listSpaces() });
}

export async function POST(request: Request) {
  const actor = await getSpaceActor(request);
  if (!actor) {
    return NextResponse.json(
      { error: 'Authentification requise.' },
      { status: 401 },
    );
  }
  if (!canContribute(actor.role)) {
    return NextResponse.json(
      { error: 'Compte approuvé requis.' },
      { status: 403 },
    );
  }

  try {
    const input = CreateSpaceSchema.parse(await request.json());
    return NextResponse.json(
      { space: await createSpace(actor, input) },
      { status: 201 },
    );
  } catch (error) {
    return spaceErrorResponse(error);
  }
}
