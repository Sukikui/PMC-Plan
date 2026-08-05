import { NextRequest, NextResponse } from 'next/server';
import { getPagination } from '@/lib/api/pagination';
import { auth } from '@/auth';
import { getEffectiveRequestRole } from '@/lib/admin/request-role';
import { invalidateSpacePublicData } from '@/lib/content/cache-tags';
import { canContribute } from '@/lib/content-permissions';
import { CreateSpaceSchema } from '@/lib/spaces/schemas';
import { createSpace, listSpaces } from '@/lib/spaces/service';
import {
  listManageableSpaceReferences,
  loadSpaceSummaries,
} from '@/lib/spaces/summary-server';
import { getSpaceActor, spaceErrorResponse } from './route-utils';

export async function GET(request: NextRequest) {
  const view = request.nextUrl.searchParams.get('view');
  if (view === 'summary') {
    const { page, pageSize } = getPagination(request.nextUrl.searchParams);
    const query = request.nextUrl.searchParams.get('q')?.trim() ?? '';
    return NextResponse.json(
      await loadSpaceSummaries(page, pageSize, query),
    );
  }
  if (view === 'reference') {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ spaces: [] });
    }
    const role = getEffectiveRequestRole(request, session.user.role);
    return NextResponse.json({
      spaces: await listManageableSpaceReferences(session.user.id, role),
    });
  }
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
    const space = await createSpace(actor, input);
    invalidateSpacePublicData(space.slug);
    return NextResponse.json(
      { space },
      { status: 201 },
    );
  } catch (error) {
    return spaceErrorResponse(error);
  }
}
