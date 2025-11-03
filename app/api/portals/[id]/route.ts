import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { z } from 'zod';
import { Prisma, World } from '@prisma/client';
import { calculateNetherAddress } from '../../utils/shared';
import { handleError, sanitizeOwners } from '../../utils/api-utils';

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
    });


    if (!portal) {
        return NextResponse.json({ error: 'Portal not found' }, { status: 404 });
    }

    const isOwner = portal.createdById === session.user.id;
    const isAdmin = session.user.role === 'admin';

    if (!isOwner && !isAdmin) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const json = await request.json();
    const payload = UpdatePortalSchema.parse(json);


    if (payload.mode === 'single') {
      const owners = sanitizeOwners(payload.portal.ownerNames);
      const slugValue = payload.portal.slug.toLowerCase();
      let address = payload.portal.address?.trim() || null;

      if (payload.portal.world === 'nether' && !address) {
        const netherAddress = await calculateNetherAddress(
          payload.portal.coordinates.x,
          payload.portal.coordinates.y,
          payload.portal.coordinates.z
        );
        address = netherAddress.address ?? null;
      }

      const updated = await prisma.portal.update({
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
          ownerNames: owners,
          status: 'pending',
        },
      });

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
    const owners = sanitizeOwners(payload.owners);
    const slugValue = payload.slug.toLowerCase();
    let netherAddress = payload.nether.address?.trim() || null;

    if (!netherAddress) {
      const netherComputed = await calculateNetherAddress(
        payload.nether.coordinates.x,
        payload.nether.coordinates.y,
        payload.nether.coordinates.z
      );
      netherAddress = netherComputed.address ?? null;
    }

    const result = await prisma.$transaction(async (tx) => {
      const overworldPortal = await tx.portal.update({
        where: { slug_world: { slug: portalId, world: 'overworld' } },
        data: {
          slug: slugValue,
          name: payload.name,
          world: 'overworld',
          coordX: payload.overworld.coordinates.x,
          coordY: payload.overworld.coordinates.y,
          coordZ: payload.overworld.coordinates.z,
          description: payload.overworld.description ?? null,
          address: null,
          ownerNames: owners,
          status: 'pending',
        },
      });

      const netherPortal = await tx.portal.update({
        where: { slug_world: { slug: portalId, world: 'nether' } },
        data: {
          slug: slugValue,
          name: payload.name,
          world: 'nether',
          coordX: payload.nether.coordinates.x,
          coordY: payload.nether.coordinates.y,
          coordZ: payload.nether.coordinates.z,
          description: payload.nether.description ?? null,
          address: netherAddress,
          ownerNames: owners,
          status: 'pending',
        },
      });

      return { overworldPortal, netherPortal };
    });

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
      });

      if (linkedPortals.length === 0) {
        return NextResponse.json({ error: 'Portal not found' }, { status: 404 });
      }

      // Check ownership/admin status for any of the linked portals
      const isOwner = linkedPortals.some(p => p.createdById === session.user.id);
      const isAdmin = session.user.role === 'admin';

      if (!isOwner && !isAdmin) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      await prisma.portal.updateMany({
        where: { slug: portalSlug },
        data: { status: 'removed' },
      });

      return NextResponse.json({ message: 'Portails liés supprimés avec succès.' }, { status: 200 });

    } else { // Single portal deletion
      if (!(worldParam === 'overworld' || worldParam === 'nether')) {
        return NextResponse.json({ error: 'World parameter is invalid.' }, { status: 400 });
      }
      const world = worldParam as World;

      const portal = await prisma.portal.findUnique({
        where: { slug_world: { slug: portalSlug, world: world } },
      });

      if (!portal) {
        return NextResponse.json({ error: 'Portal not found' }, { status: 404 });
      }

      const isOwner = portal.createdById === session.user.id;
      const isAdmin = session.user.role === 'admin';

      if (!isOwner && !isAdmin) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      await prisma.portal.update({
        where: { uid: portal.uid },
        data: { status: 'removed' },
      });

      return NextResponse.json({ message: 'Portail supprimé avec succès.' }, { status: 200 });
    }
  } catch (error: unknown) {
    return NextResponse.json({ error: (error instanceof Error ? error.message : 'An unknown error occurred') || 'Impossible de supprimer le portail' }, { status: 500 });
  }
}
