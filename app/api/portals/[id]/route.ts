import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { getEffectiveRequestRole } from '@/lib/admin/request-role';
import { z } from 'zod';
import { Prisma, World } from '@/generated/prisma/client';
import { resolveNetherAddressForWorld } from '../../utils/shared';
import { handleError } from '../../utils/api-utils';
import { canContribute, canManageContent } from '@/lib/content-permissions';
import { MapEntryError } from '@/lib/map-entry/service';
import { updateMapEntryPresentation } from '@/lib/map-entry/presentation';
import { indexLinkedPortalPairs } from '@/lib/portal/linked-portals';
import {
  prepareMapEntryCreation,
  prepareMapEntryUpdate,
} from '@/lib/map-entry/creation';
import {
  claimMapEntryManagement,
  updateMapEntryManagement,
} from '@/lib/map-entry/management-update';
import { MinecraftProfileError } from '@/lib/minecraft/profiles';
import { invalidateRouteData } from '../../route/service/route-data';
import { invalidateMapEntryPublicData } from '@/lib/content/cache-tags';
import { normalizeContentImages } from '@/lib/content/images';
import {
  claimPortalIdentity,
  updatePortalIdentity,
} from '@/lib/portal/identity.server';
import {
  getPortalDisplayName,
  isPortalUnidentified,
} from '@/lib/portal/identity';

import { ClaimPortalSchema, UpdatePortalSchema } from '../../utils/schemas';
import { deletePortal } from './delete-portal';

type PortalRouteContext = {
  params: Promise<{ id: string }>;
};

export async function PUT(request: NextRequest, context: PortalRouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentification requise.' }, { status: 401 });
    }

    const { id: portalId } = await context.params;
    const worldParam = request.nextUrl.searchParams.get('world');
    const isClaim = request.nextUrl.searchParams.get('claim') === 'true';
    const claimMapEntryId = request.nextUrl.searchParams.get('mapEntryId');

    if (!worldParam || !(worldParam === 'overworld' || worldParam === 'nether')) {
      return NextResponse.json({ error: 'World parameter is missing or invalid.' }, { status: 400 });
    }

    const world = worldParam as World;
    if (isClaim && !claimMapEntryId) {
      return NextResponse.json(
        { error: 'Le portail à revendiquer est introuvable.' },
        { status: 400 },
      );
    }

    const portal = await prisma.portal.findFirst({
      where: isClaim
        ? { mapEntryId: claimMapEntryId!, world }
        : { slug: portalId, world },
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
    const access = {
      primaryManagerId: portal.mapEntry.primaryManagerId,
      managerIds: portal.mapEntry.managers.map(({ userId }) => userId),
    };
    if (isClaim && !canContribute(actorRole)) {
      return NextResponse.json({ error: 'Accès refusé.' }, { status: 403 });
    }
    if (isClaim && !isPortalUnidentified(portal.name)) {
      return NextResponse.json(
        { error: 'Ce portail ne peut pas être revendiqué.' },
        { status: 409 },
      );
    }
    if (!isClaim && !canManageContent(actorRole, session.user.id, access)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const json = await request.json();
    const mutation = await preparePortalMutation(isClaim, json);
    const { payload } = mutation;
    const images = normalizeContentImages(payload.images);


    if (payload.mode === 'single') {
      const address = await resolveNetherAddressForWorld(
        payload.portal.world,
        payload.portal.coordinates,
        payload.portal.address
      );

      const updated = await prisma.$transaction(async (tx) => {
        const identity = mutation.intent === 'claim'
          ? await claimPortalIdentity(
              tx,
              portal.mapEntryId,
              mutation.payload.identity,
              1,
            )
          : updatePortalIdentity(portal, mutation.payload.identity);
        const updatedPortal = await tx.portal.update({
          where: { uid: portal.uid },
          data: {
            ...identity,
            world: payload.portal.world,
            coordX: payload.portal.coordinates.x,
            coordY: payload.portal.coordinates.y,
            coordZ: payload.portal.coordinates.z,
            description: payload.portal.description ?? null,
            address,
          },
        });
        await applySharedPortalUpdate(tx, portal.mapEntryId, {
          userId: session.user.id,
          role: actorRole,
        }, mutation, { color: payload.color, images, spaceId: payload.spaceId });
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
              name: getPortalDisplayName(updated.name),
              unidentified: isPortalUnidentified(updated.name),
              images,
            },
          ],
        },
        { status: 200 }
      );
    }

    // linked portals
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
      const identity = mutation.intent === 'claim'
        ? await claimPortalIdentity(
            tx,
            portal.mapEntryId,
            mutation.payload.identity,
            2,
          )
        : updatePortalIdentity(pair.overworld, mutation.payload.identity);
      await tx.portal.updateMany({
        where: { mapEntryId: portal.mapEntryId },
        data: identity,
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

      await applySharedPortalUpdate(tx, portal.mapEntryId, {
        userId: session.user.id,
        role: actorRole,
      }, mutation, { color: payload.color, images, spaceId: payload.spaceId });
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
              name: getPortalDisplayName(result.overworldPortal.name),
              unidentified: isPortalUnidentified(result.overworldPortal.name),
              images,
            },
            {
              slug: result.netherPortal.slug,
              world: result.netherPortal.world,
              name: getPortalDisplayName(result.netherPortal.name),
              unidentified: isPortalUnidentified(result.netherPortal.name),
              images,
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

async function preparePortalMutation(isClaim: boolean, json: unknown) {
  if (isClaim) {
    const payload = ClaimPortalSchema.parse(json);
    return {
      intent: 'claim' as const,
      payload,
      management: await prepareMapEntryCreation(payload.management),
    };
  }
  const payload = UpdatePortalSchema.parse(json);
  return {
    intent: 'edit' as const,
    payload,
    management: payload.management
      ? await prepareMapEntryUpdate(payload.management, {
          includeOwners: payload.identity.status === 'identified',
        })
      : null,
  };
}

async function applySharedPortalUpdate(
  tx: Prisma.TransactionClient,
  mapEntryId: string,
  actor: { userId: string; role?: string },
  mutation: Awaited<ReturnType<typeof preparePortalMutation>>,
  presentation: {
    color?: string;
    images: string[];
    spaceId: string | null | undefined;
  },
) {
  if (mutation.intent === 'claim') {
    await claimMapEntryManagement(tx, mapEntryId, actor, mutation.management);
  }
  await updateMapEntryPresentation(tx, mapEntryId, actor, presentation);
  if (mutation.intent === 'edit' && mutation.management) {
    await updateMapEntryManagement(tx, mapEntryId, actor, mutation.management);
  }
}

export const DELETE = deletePortal;
