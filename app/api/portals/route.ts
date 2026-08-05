import { NextRequest, NextResponse } from 'next/server';
import { 
  loadPortals, 
  resolveNetherAddressForWorld
} from '../utils/shared';
import { handleError, parseQueryParams } from '../utils/api-utils';
import { z } from 'zod';
import { auth } from '@/auth';
import { getEffectiveRequestRole } from '@/lib/admin/request-role';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { canContribute } from '@/lib/content-permissions';
import { createMapEntry, MapEntryError } from '@/lib/map-entry/service';
import { prepareMapEntryCreation } from '@/lib/map-entry/creation';
import { validateSpaceAssociation } from '@/lib/map-entry/space-association';
import { MinecraftProfileError } from '@/lib/minecraft/profiles';
import {
  indexLinkedPortalPairs,
  mergeLinkedPortalPair,
} from '@/lib/portal/linked-portals';
import { invalidateRouteData } from '../route/service/route-data';
import { invalidateMapEntryPublicData } from '@/lib/content/cache-tags';

const QuerySchema = z.object({
  'merge-nether-portals': z.coerce.boolean().optional().default(false),
});

export async function GET(request: NextRequest) {
  try {
    const { 'merge-nether-portals': mergeNetherPortals } = parseQueryParams(request.url, QuerySchema);

    const portals = await loadPortals();

    if (mergeNetherPortals) {
      const pairs = indexLinkedPortalPairs(portals);
      const mergedPortals = portals.flatMap((portal) => {
        const pair = pairs.get(portal.mapEntryId);
        if (!pair) return [portal];
        return portal.world === 'overworld'
          ? [mergeLinkedPortalPair(pair)]
          : [];
      });
      return NextResponse.json(mergedPortals);
    }

    return NextResponse.json(portals);

  } catch (error) {
    return handleError(error, 'Unexpected server error');
  }
}

import { CreatePortalSchema } from '../utils/schemas';



export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentification requise.' }, { status: 401 });
    }
    const actorRole = getEffectiveRequestRole(request, session.user.role);
    if (!canContribute(actorRole)) {
      return NextResponse.json(
        { error: 'Ton compte doit être approuvé avant de pouvoir créer un portail.' },
        { status: 403 },
      );
    }

    const json = await request.json();
    const payload = CreatePortalSchema.parse(json);
    const userId = session.user.id;
    const management = await prepareMapEntryCreation(
      payload.management,
      payload.spaceId,
    );

    if (payload.mode === 'single') {
      const slugValue = payload.portal.slug.toLowerCase();
      const address = await resolveNetherAddressForWorld(
        payload.portal.world,
        payload.portal.coordinates,
        payload.portal.address
      );

      const created = await prisma.$transaction(async (tx) => {
        await validateSpaceAssociation(tx, {
          userId,
          role: actorRole,
        }, management.spaceId);
        const mapEntry = await createMapEntry(tx, userId, management);
        return tx.portal.create({
          data: {
            slug: slugValue,
            name: payload.portal.name,
            world: payload.portal.world,
            coordX: payload.portal.coordinates.x,
            coordY: payload.portal.coordinates.y,
            coordZ: payload.portal.coordinates.z,
            description: payload.portal.description ?? null,
            address,
            mapEntryId: mapEntry.id,
          },
        });
      });
      invalidateRouteData();
      invalidateMapEntryPublicData('portal', created.mapEntryId);

      return NextResponse.json(
        {
          portals: [
            {
              slug: created.slug,
              world: created.world,
              name: created.name,
            },
          ],
        },
        { status: 201 }
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
      await validateSpaceAssociation(tx, {
        userId,
        role: actorRole,
      }, management.spaceId);
      const mapEntry = await createMapEntry(tx, userId, management);
      const overworldPortal = await tx.portal.create({
        data: {
          slug: slugValue,
          name: payload.name,
          world: 'overworld',
          coordX: payload.overworld.coordinates.x,
          coordY: payload.overworld.coordinates.y,
          coordZ: payload.overworld.coordinates.z,
          description: payload.overworld.description ?? null,
          address: null,
          mapEntryId: mapEntry.id,
        },
      });

      const netherPortal = await tx.portal.create({
        data: {
          slug: slugValue,
          name: payload.name,
          world: 'nether',
          coordX: payload.nether.coordinates.x,
          coordY: payload.nether.coordinates.y,
          coordZ: payload.nether.coordinates.z,
          description: payload.nether.description ?? null,
          address: netherAddress,
          mapEntryId: mapEntry.id,
        },
      });

      return { overworldPortal, netherPortal };
    });
    invalidateRouteData();
    invalidateMapEntryPublicData('portal', result.overworldPortal.mapEntryId);

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
      { status: 201 }
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
    return handleError(error, 'Impossible de créer le portail');
  }
}
