import { NextRequest, NextResponse } from 'next/server';
import { World } from '@/generated/prisma/client';
import { auth } from '@/auth';
import { getEffectiveRequestRole } from '@/lib/admin/request-role';
import { canAdministerContent } from '@/lib/content-permissions';
import { invalidateMapEntryPublicData } from '@/lib/content/cache-tags';
import { prisma } from '@/lib/prisma';
import { invalidateRouteData } from '../../route/service/route-data';

type PortalDeleteContext = {
  params: Promise<{ id: string }>;
};

export async function deletePortal(
  request: NextRequest,
  context: PortalDeleteContext,
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentification requise.' },
        { status: 401 },
      );
    }

    const { id: portalSlug } = await context.params;
    const worldParam = request.nextUrl.searchParams.get('world');
    if (!worldParam) {
      return deleteLinkedPortals(request, portalSlug, session.user);
    }
    if (worldParam !== 'overworld' && worldParam !== 'nether') {
      return NextResponse.json(
        { error: 'Le monde est invalide.' },
        { status: 400 },
      );
    }
    return deleteSinglePortal(
      request,
      portalSlug,
      worldParam as World,
      session.user,
    );
  } catch (error: unknown) {
    return NextResponse.json({
      error: error instanceof Error
        ? error.message
        : 'Impossible de supprimer le portail.',
    }, { status: 500 });
  }
}

async function deleteLinkedPortals(
  request: NextRequest,
  portalSlug: string,
  user: { id: string; role: string },
) {
  const linkedPortals = await prisma.portal.findMany({
    where: { slug: portalSlug },
    include: {
      mapEntry: { select: { primaryManagerId: true } },
    },
  });
  if (!linkedPortals.length) {
    return NextResponse.json({ error: 'Portail introuvable.' }, { status: 404 });
  }

  const actorRole = getEffectiveRequestRole(request, user.role);
  const canDeleteAll = linkedPortals.every(({ mapEntry }) => (
    canAdministerContent(actorRole, user.id, mapEntry.primaryManagerId)
  ));
  if (!canDeleteAll) {
    return NextResponse.json({ error: 'Accès refusé.' }, { status: 403 });
  }

  const mapEntryIds = Array.from(new Set(
    linkedPortals.map(({ mapEntryId }) => mapEntryId),
  ));
  await prisma.mapEntry.deleteMany({ where: { id: { in: mapEntryIds } } });
  invalidateRouteData();
  mapEntryIds.forEach((mapEntryId) => {
    invalidateMapEntryPublicData('portal', mapEntryId);
  });
  return NextResponse.json(
    { message: 'Portails liés supprimés avec succès.' },
    { status: 200 },
  );
}

async function deleteSinglePortal(
  request: NextRequest,
  portalSlug: string,
  world: World,
  user: { id: string; role: string },
) {
  const portal = await prisma.portal.findUnique({
    where: { slug_world: { slug: portalSlug, world } },
    include: {
      mapEntry: {
        select: {
          primaryManagerId: true,
          _count: { select: { portals: true } },
        },
      },
    },
  });
  if (!portal) {
    return NextResponse.json({ error: 'Portail introuvable.' }, { status: 404 });
  }

  const actorRole = getEffectiveRequestRole(request, user.role);
  if (!canAdministerContent(actorRole, user.id, portal.mapEntry.primaryManagerId)) {
    return NextResponse.json({ error: 'Accès refusé.' }, { status: 403 });
  }

  if (portal.mapEntry._count.portals === 1) {
    await prisma.mapEntry.delete({ where: { id: portal.mapEntryId } });
  } else {
    await prisma.portal.delete({ where: { uid: portal.uid } });
  }
  invalidateRouteData();
  invalidateMapEntryPublicData('portal', portal.mapEntryId);
  return NextResponse.json(
    { message: 'Portail supprimé avec succès.' },
    { status: 200 },
  );
}
