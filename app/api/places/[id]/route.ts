import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { z } from 'zod';
import { Prisma, ApprovalStatus } from '@prisma/client';


import { UpdatePlaceSchema } from '../../utils/schemas';

import { sanitizeOwners, sanitizeTags } from '../../utils/api-utils';

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
    });

    if (!place) {
      return NextResponse.json({ error: 'Place not found' }, { status: 404 });
    }

    const isOwner = place.createdById === session.user.id;
    const isAdmin = session.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const json = await request.json();
    const payload = UpdatePlaceSchema.parse(json);

    const owners = sanitizeOwners(payload.owners);
    const tags = sanitizeTags(payload.tags);
    const description = payload.description?.trim() || null;
    const discordUrl = payload.discordUrl?.trim() || null;
    const imageUrl = payload.imageUrl?.trim() || null;

    const tradeOffersData = 
      payload.tradeOffers?.map((offer) => ({
        negotiable: offer.negotiable,
        items: {
          create: offer.items.map((item) => ({
            kind: item.kind,
            itemId: item.itemId,
            quantity: item.quantity,
            enchanted: item.enchanted,
            customName: item.customName?.trim() || null,
          })),
        },
      })) ?? [];

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
        coordX: payload.coordinates.x,
        coordY: payload.coordinates.y,
        coordZ: payload.coordinates.z,
        description,
        imageUrl,
        tags,
        ownerNames: owners,
        discordUrl,
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
      return updatedPlace;
    });

    const updatedImageUrl = updatedPlace.imageUrl ?? null;
    return NextResponse.json(
      {
        place: {
          slug: updatedPlace.slug,
          name: updatedPlace.name,
          imageUrl: updatedImageUrl,
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
    });

    if (!place) {
      return NextResponse.json({ error: 'Place not found' }, { status: 404 });
    }

    const isOwner = place.createdById === session.user.id;
    const isAdmin = session.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.place.update({
      where: { uid: place.uid },
      data: { status: ApprovalStatus.removed },
    });

    return NextResponse.json({ message: 'Lieu supprimé avec succès.' }, { status: 200 });
  } catch (error: unknown) {
    return NextResponse.json({ error: (error instanceof Error ? error.message : 'An unknown error occurred') || 'Impossible de supprimer le lieu' }, { status: 500 });
  }
}
