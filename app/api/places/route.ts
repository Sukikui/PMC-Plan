import { NextRequest, NextResponse } from 'next/server';
import { loadPlaces } from '../utils/shared';
import { handleError, sanitizeOwners, sanitizeTags } from '../utils/api-utils';
import { z } from 'zod';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function GET() {
  try {
    const places = await loadPlaces();
    return NextResponse.json(places);
  } catch (error) {
    // The loadPlaces function already logs warnings for individual file errors.
    // This catch block will handle more critical errors, like the directory not existing.
    return handleError(error, 'Failed to load places');
  }
}

import { CreatePlaceSchema } from '../utils/schemas';



export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentification requise.' }, { status: 401 });
    }

    const json = await request.json();
    const payload = CreatePlaceSchema.parse(json);

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

  const placeData: Prisma.PlaceCreateInput = {
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
    status: 'pending',
    creator: { connect: { id: session.user.id } },
      tradeOffers: tradeOffersData.length
        ? {
            create: tradeOffersData,
          }
        : undefined,
    };

    const created = await prisma.place.create({
      data: placeData,
    });

    const createdImageUrl = created.imageUrl ?? null;
    return NextResponse.json(
      {
        place: {
          slug: created.slug,
          name: created.name,
          imageUrl: createdImageUrl,
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? 'Requête invalide.' }, { status: 400 });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json({ error: 'Un lieu avec cet identifiant existe déjà.' }, { status: 409 });
    }
    return handleError(error, 'Impossible de créer le lieu');
  }
}
