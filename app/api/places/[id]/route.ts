import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { getEffectiveRequestRole } from '@/lib/admin/request-role';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { resolveNetherAddressForWorld } from '../../utils/shared';
import { normalizePlaceImages } from '@/lib/place/images';
import {
  canAdministerContent,
  canManageContent,
} from '@/lib/content-permissions';
import { buildTradeOffersCreateData } from '../../utils/trade-offers';
import { MapEntryError } from '@/lib/map-entry/service';
import { setMapEntrySpace } from '@/lib/map-entry/space-association';
import { prepareMapEntryUpdate } from '@/lib/map-entry/creation';
import { updateMapEntryManagement } from '@/lib/map-entry/management-update';
import { MinecraftProfileError } from '@/lib/minecraft/profiles';


import { UpdatePlaceSchema } from '../../utils/schemas';

import { sanitizeTags } from '../../utils/api-utils';

export async function PUT(request: NextRequest, context: any) {
  const { params } = context as { params: { id: string } };
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentification requise.' }, { status: 401 });
    }

    const { id: placeId } = await params;
    const place = await prisma.place.findUnique({
      where: { slug: placeId },
      include: {
        mapEntry: {
          include: {
            managers: { select: { userId: true } },
          },
        },
      },
    });

    if (!place) {
      return NextResponse.json({ error: 'Place not found' }, { status: 404 });
    }

    const actorRole = getEffectiveRequestRole(request, session.user.role);
    if (!canManageContent(actorRole, session.user.id, {
      primaryManagerId: place.mapEntry.primaryManagerId,
      managerIds: place.mapEntry.managers.map(({ userId }) => userId),
    })) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const json = await request.json();
    const payload = UpdatePlaceSchema.parse(json);

    const tags = sanitizeTags(payload.tags);
    const description = payload.description?.trim() || null;
    const address = await resolveNetherAddressForWorld(payload.world, payload.coordinates, payload.address);
    const discordUrl = payload.discordUrl?.trim() || null;
    const images = normalizePlaceImages(payload.images);

    const tradeOffersData = buildTradeOffersCreateData(payload.tradeOffers);
    const management = payload.management
      ? await prepareMapEntryUpdate(payload.management)
      : null;

    const updatedPlace = await prisma.$transaction(async (tx) => {
      // 1. Delete all TradeItems associated with the place's trade offers
      await tx.tradeItem.deleteMany({
        where: {
          offer: {
            placeUid: place.uid,
          },
        },
      });

      // 2. Delete all TradeOffers associated with the place
      await tx.tradeOffer.deleteMany({
        where: { placeUid: place.uid },
      });

      const placeData: Prisma.PlaceUpdateInput = {
        slug: payload.slug.toLowerCase(),
        name: payload.name,
        world: payload.world,
        category: payload.category,
        coordX: payload.coordinates.x,
        coordY: payload.coordinates.y,
        coordZ: payload.coordinates.z,
        description,
        address,
        tags,
        discordUrl,
        images,
        tradeOffers: tradeOffersData.length
          ? {
              create: tradeOffersData,
            }
          : undefined,
      };

      const updatedPlace = await tx.place.update({
        where: { uid: place.uid },
        data: placeData,
      });
      await setMapEntrySpace(tx, place.mapEntryId, {
        userId: session.user.id,
        role: actorRole,
      }, payload.spaceId);
      if (management) {
        await updateMapEntryManagement(tx, place.mapEntryId, {
          userId: session.user.id,
          role: actorRole,
        }, management);
      }
      return updatedPlace;
    });

    return NextResponse.json(
      {
        place: {
          slug: updatedPlace.slug,
          name: updatedPlace.name,
          images: updatedPlace.images,
        },
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? 'Requête invalide.' }, { status: 400 });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json({ error: 'Un lieu avec cet identifiant existe déjà.' }, { status: 409 });
    }
    if (error instanceof MinecraftProfileError || error instanceof MapEntryError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: (error instanceof Error ? error.message : 'An unknown error occurred') || 'Impossible de mettre à jour le lieu' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: any) {
  const { params } = context as { params: { id: string } };
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentification requise.' }, { status: 401 });
    }

    const { id: placeId } = await params;
    const place = await prisma.place.findUnique({
      where: { slug: placeId },
      include: {
        mapEntry: {
          select: { primaryManagerId: true },
        },
      },
    });

    if (!place) {
      return NextResponse.json({ error: 'Place not found' }, { status: 404 });
    }

    const actorRole = getEffectiveRequestRole(request, session.user.role);
    if (!canAdministerContent(
      actorRole,
      session.user.id,
      place.mapEntry.primaryManagerId,
    )) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.mapEntry.delete({
      where: { id: place.mapEntryId },
    });

    return NextResponse.json({ message: 'Lieu supprimé avec succès.' }, { status: 200 });
  } catch (error: unknown) {
    return NextResponse.json({ error: (error instanceof Error ? error.message : 'An unknown error occurred') || 'Impossible de supprimer le lieu' }, { status: 500 });
  }
}
