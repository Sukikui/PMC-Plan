import { NextRequest, NextResponse } from 'next/server';
import { loadPlaces, resolveNetherAddressForWorld } from '../utils/shared';
import { handleError, sanitizeTags } from '../utils/api-utils';
import { z } from 'zod';
import { auth } from '@/auth';
import { getEffectiveRequestRole } from '@/lib/admin/request-role';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { normalizePlaceImages } from '@/lib/place/images';
import { canContribute } from '@/lib/content-permissions';
import { buildTradeOffersCreateData } from '../utils/trade-offers';
import { createMapEntry, MapEntryError } from '@/lib/map-entry/service';
import { prepareMapEntryCreation } from '@/lib/map-entry/creation';
import { validateSpaceAssociation } from '@/lib/map-entry/space-association';
import { MinecraftProfileError } from '@/lib/minecraft/profiles';

export async function GET() {
  try {
    const places = await loadPlaces();
    return NextResponse.json(places);
  } catch (error) {
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
    const actorRole = getEffectiveRequestRole(request, session.user.role);
    if (!canContribute(actorRole)) {
      return NextResponse.json(
        { error: 'Ton compte doit être approuvé avant de pouvoir créer un lieu.' },
        { status: 403 },
      );
    }

    const json = await request.json();
    const payload = CreatePlaceSchema.parse(json);

    const tags = sanitizeTags(payload.tags);
    const description = payload.description?.trim() || null;
    const address = await resolveNetherAddressForWorld(payload.world, payload.coordinates, payload.address);
    const discordUrl = payload.discordUrl?.trim() || null;
    const images = normalizePlaceImages(payload.images);

    const tradeOffersData = buildTradeOffersCreateData(payload.tradeOffers);
    const management = await prepareMapEntryCreation(
      payload.management,
      payload.spaceId,
    );

    const created = await prisma.$transaction(async (tx) => {
      await validateSpaceAssociation(tx, {
        userId: session.user.id,
        role: actorRole,
      }, management.spaceId);
      const mapEntry = await createMapEntry(tx, session.user.id, management);
      return tx.place.create({
        data: {
          slug: payload.slug.toLowerCase(),
          name: payload.name,
          world: payload.world,
          category: payload.category,
          coordX: payload.coordinates.x,
          coordY: payload.coordinates.y,
          coordZ: payload.coordinates.z,
          description,
          address,
          images,
          tags,
          discordUrl,
          mapEntryId: mapEntry.id,
          tradeOffers: tradeOffersData.length
            ? {
                create: tradeOffersData,
              }
            : undefined,
        },
      });
    });

    return NextResponse.json(
      {
        place: {
          slug: created.slug,
          name: created.name,
          images: created.images,
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
    if (error instanceof MinecraftProfileError || error instanceof MapEntryError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return handleError(error, 'Impossible de créer le lieu');
  }
}
