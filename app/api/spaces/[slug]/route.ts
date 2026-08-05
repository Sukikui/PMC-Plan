import { NextResponse } from 'next/server';
import { UpdateSpaceSchema } from '@/lib/spaces/schemas';
import {
  deleteSpace,
  updateSpace,
} from '@/lib/spaces/service';
import { loadSpaceDetail } from '@/lib/spaces/detail-server';
import { invalidateSpacePublicData } from '@/lib/content/cache-tags';
import {
  getSpaceActor,
  spaceErrorResponse,
} from '../route-utils';

interface RouteContext {
  params: Promise<{ slug: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  const { slug } = await context.params;
  const space = await loadSpaceDetail(slug);
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
    const space = await updateSpace(slug, actor, input);
    invalidateSpacePublicData(slug);
    if (space.slug !== slug) invalidateSpacePublicData(space.slug);
    return NextResponse.json({ space });
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
    invalidateSpacePublicData(slug);
    return NextResponse.json({ message: 'Espace supprimé.' });
  } catch (error) {
    return spaceErrorResponse(error);
  }
}
