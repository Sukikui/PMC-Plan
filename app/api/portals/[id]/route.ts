import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { getEffectiveRequestRole } from '@/lib/admin/request-role';
import { z } from 'zod';
import { Prisma, World } from '@prisma/client';
import { resolveNetherAddressForWorld } from '../../utils/shared';
import { handleError } from '../../utils/api-utils';
import {
  canAdministerContent,
  canManageContent,
} from '@/lib/content-permissions';
import { MapEntryError } from '@/lib/map-entry/service';
import { setMapEntrySpace } from '@/lib/map-entry/space-association';
import { indexLinkedPortalPairs } from '@/lib/portal/linked-portals';
import { prepareMapEntryUpdate } from '@/lib/map-entry/creation';
import { updateMapEntryManagement } from '@/lib/map-entry/management-update';
import { MinecraftProfileError } from '@/lib/minecraft/profiles';
import { invalidateRouteData } from '../../route/service/route-data';
import { invalidateMapEntryPublicData } from '@/lib/content/cache-tags';

import { UpdatePortalSchema } from '../../utils/schemas';



export async function PUT(request: NextRequest, context: any) {
  const { params } = context;
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentification requise.' }, { status: 401 });
    }

    const portalId = params.id;
    const worldParam = request.nextUrl.searchParams.get('world');

    if (!worldParam || !(worldParam === 'overworld' || worldParam === 'nether')) {
      return NextResponse.json({ error: 'World parameter is missing or invalid.' }, { status: 400 });
    }

    const world = worldParam as World;

    const portal = await prisma.portal.findUnique({
      where: { slug_world: { slug: portalId, world: world } },
      include: {
        mapEntry: {
          include: {
            managers: { select: { userId: true } },
          },
        },
      },
    });


    if (!portal) {
        return NextResponse.json({ error: 'Portal not found' }, { status: 404 });
    }

    const actorRole = getEffectiveRequestRole(request, session.user.role);
    if (!canManageContent(actorRole, session.user.id, {
      primaryManagerId: portal.mapEntry.primaryManagerId,
      managerIds: portal.mapEntry.managers.map(({ userId }) => userId),
    })) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const json = await request.json();
    const payload = UpdatePortalSchema.parse(json);
    const management = payload.management
      ? await prepareMapEntryUpdate(payload.management)
      : null;


    if (payload.mode === 'single') {
      const slugValue = payload.portal.slug.toLowerCase();
      const address = await resolveNetherAddressForWorld(
        payload.portal.world,
        payload.portal.coordinates,
        payload.portal.address
      );

      const updated = await prisma.$transaction(async (tx) => {
        const updatedPortal = await tx.portal.update({
          where: { uid: portal.uid },
          data: {
            slug: slugValue,
            name: payload.portal.name,
            world: payload.portal.world,
            coordX: payload.portal.coordinates.x,
            coordY: payload.portal.coordinates.y,
            coordZ: payload.portal.coordinates.z,
            description: payload.portal.description ?? null,
            address,
          },
        });
        await setMapEntrySpace(tx, portal.mapEntryId, {
          userId: session.user.id,
          role: actorRole,
        }, payload.spaceId);
        if (management) {
          await updateMapEntryManagement(tx, portal.mapEntryId, {
            userId: session.user.id,
            role: actorRole,
          }, management);
        }
        return updatedPortal;
      });
      invalidateRouteData();
      invalidateMapEntryPublicData('portal', portal.mapEntryId);

      return NextResponse.json(
        {
          portals: [
            {
              slug: updated.slug,
              world: updated.world,
              name: updated.name,
            },
          ],
        },
        { status: 200 }
      );
    }

    // linked portals
    const slugValue = payload.slug.toLowerCase();
    const netherAddress = await resolveNetherAddressForWorld(
      'nether',
      payload.nether.coordinates,
      payload.nether.address
    );

    const result = await prisma.$transaction(async (tx) => {
      const pair = indexLinkedPortalPairs(await tx.portal.findMany({
        where: { mapEntryId: portal.mapEntryId },
      })).get(portal.mapEntryId);
      if (!pair) {
        throw new MapEntryError('La paire de portails liée est incomplète.', 409);
      }
      await tx.portal.updateMany({
        where: { mapEntryId: portal.mapEntryId },
        data: {
          slug: slugValue,
          name: payload.name,
        },
      });
      const overworldPortal = await tx.portal.update({
        where: { uid: pair.overworld.uid },
        data: {
          coordX: payload.overworld.coordinates.x,
          coordY: payload.overworld.coordinates.y,
          coordZ: payload.overworld.coordinates.z,
          description: payload.overworld.description ?? null,
          address: null,
        },
      });

      const netherPortal = await tx.portal.update({
        where: { uid: pair.nether.uid },
        data: {
          coordX: payload.nether.coordinates.x,
          coordY: payload.nether.coordinates.y,
          coordZ: payload.nether.coordinates.z,
          description: payload.nether.description ?? null,
          address: netherAddress,
        },
      });

      await setMapEntrySpace(tx, portal.mapEntryId, {
        userId: session.user.id,
        role: actorRole,
      }, payload.spaceId);
      if (management) {
        await updateMapEntryManagement(tx, portal.mapEntryId, {
          userId: session.user.id,
          role: actorRole,
        }, management);
      }
      return { overworldPortal, netherPortal };
    });
    invalidateRouteData();
    invalidateMapEntryPublicData('portal', portal.mapEntryId);

    return NextResponse.json(
      {
        portals: [
            {
              slug: result.overworldPortal.slug,
              world: result.overworldPortal.world,
              name: result.overworldPortal.name,
            },
            {
              slug: result.netherPortal.slug,
              world: result.netherPortal.world,
              name: result.netherPortal.name,
            },
        ],
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? 'Requête invalide.' }, { status: 400 });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json({ error: 'Un portail avec ce slug existe déjà pour ce monde.' }, { status: 409 });
    }
    if (error instanceof MinecraftProfileError || error instanceof MapEntryError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return handleError(error, 'Impossible de mettre à jour le portail');
  }
}

export async function DELETE(request: NextRequest, context: any) {
  const { params } = context as { params: { id: string } };
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentification requise.' }, { status: 401 });
    }

    const { id: portalSlug } = await params;
    const worldParam = request.nextUrl.searchParams.get('world');

    // If worldParam is not provided, assume it's a linked portal deletion attempt
    if (!worldParam) {
      // Attempt to delete linked portals (both overworld and nether)
      const linkedPortals = await prisma.portal.findMany({
        where: { slug: portalSlug },
        include: {
          mapEntry: {
            select: { primaryManagerId: true },
          },
        },
      });

      if (linkedPortals.length === 0) {
        return NextResponse.json({ error: 'Portal not found' }, { status: 404 });
      }

      const actorRole = getEffectiveRequestRole(request, session.user.role);
      const canDeleteAll = linkedPortals.every(({ mapEntry }) => (
        canAdministerContent(
          actorRole,
          session.user.id,
          mapEntry.primaryManagerId,
        )
      ));
      if (!canDeleteAll) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      const mapEntryIds = Array.from(new Set(
        linkedPortals.map(({ mapEntryId }) => mapEntryId),
      ));
      await prisma.mapEntry.deleteMany({
        where: {
          id: { in: mapEntryIds },
        },
      });
      invalidateRouteData();
      mapEntryIds.forEach((mapEntryId) => {
        invalidateMapEntryPublicData('portal', mapEntryId);
      });

      return NextResponse.json({ message: 'Portails liés supprimés avec succès.' }, { status: 200 });

    } else { // Single portal deletion
      if (!(worldParam === 'overworld' || worldParam === 'nether')) {
        return NextResponse.json({ error: 'World parameter is invalid.' }, { status: 400 });
      }
      const world = worldParam as World;

      const portal = await prisma.portal.findUnique({
        where: { slug_world: { slug: portalSlug, world: world } },
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
        return NextResponse.json({ error: 'Portal not found' }, { status: 404 });
      }

      const actorRole = getEffectiveRequestRole(request, session.user.role);
      if (!canAdministerContent(
        actorRole,
        session.user.id,
        portal.mapEntry.primaryManagerId,
      )) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      if (portal.mapEntry._count.portals === 1) {
        await prisma.mapEntry.delete({ where: { id: portal.mapEntryId } });
      } else {
        await prisma.portal.delete({ where: { uid: portal.uid } });
      }
      invalidateRouteData();
      invalidateMapEntryPublicData('portal', portal.mapEntryId);

      return NextResponse.json({ message: 'Portail supprimé avec succès.' }, { status: 200 });
    }
  } catch (error: unknown) {
    return NextResponse.json({ error: (error instanceof Error ? error.message : 'An unknown error occurred') || 'Impossible de supprimer le portail' }, { status: 500 });
  }
}
