import { NextResponse } from 'next/server';
import { UpdateSpaceSchema } from '@/lib/spaces/schemas';
import {
  deleteSpace,
  getSpace,
  updateSpace,
} from '@/lib/spaces/service';
import {
  getSpaceActor,
  spaceErrorResponse,
} from '../route-utils';

interface RouteContext {
  params: Promise<{ slug: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  const { slug } = await context.params;
  const space = await getSpace(slug);
  if (!space) {
    return NextResponse.json(
      { error: 'Espace introuvable.' },
      { status: 404 },
    );
  }
  return NextResponse.json({ space });
}

export async function PUT(request: Request, context: RouteContext) {
  const actor = await getSpaceActor(request);
  if (!actor) {
    return NextResponse.json(
      { error: 'Authentification requise.' },
      { status: 401 },
    );
  }

  try {
    const { slug } = await context.params;
    const input = UpdateSpaceSchema.parse(await request.json());
    return NextResponse.json({ space: await updateSpace(slug, actor, input) });
  } catch (error) {
    return spaceErrorResponse(error);
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const actor = await getSpaceActor(request);
  if (!actor) {
    return NextResponse.json(
      { error: 'Authentification requise.' },
      { status: 401 },
    );
  }

  try {
    const { slug } = await context.params;
    await deleteSpace(slug, actor);
    return NextResponse.json({ message: 'Espace supprimé.' });
  } catch (error) {
    return spaceErrorResponse(error);
  }
}
