import { NextRequest, NextResponse } from 'next/server';
import { loadPlaces } from '../utils/shared';
import { handleError } from '../utils/api-utils';
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

const coordinateSchema = z.object({
  x: z.number(),
  y: z.number(),
  z: z.number(),
});

const slugSchema = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[a-z0-9-]+$/, 'Le slug ne doit contenir que des lettres minuscules, des chiffres et des tirets.');

const ownerSchema = z.string().min(1).max(64);
const tagSchema = z.string().min(1).max(32);

const tradeItemSchema = z.object({
  kind: z.enum(['gives', 'wants']),
  itemId: z.string().min(1).max(80),
  quantity: z.number().int().positive(),
  enchanted: z.boolean(),
  customName: z.string().max(120).nullable().optional(),
});

const tradeOfferSchema = z
  .object({
    negotiable: z.boolean(),
    items: z.array(tradeItemSchema).min(1),
  })
  .superRefine((offer, ctx) => {
    const hasGives = offer.items.some((item) => item.kind === 'gives');
    if (!hasGives) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Chaque offre doit contenir au moins un item proposé.',
        path: ['items'],
      });
    }
    if (!offer.negotiable) {
      const hasWants = offer.items.some((item) => item.kind === 'wants');
      if (!hasWants) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Les offres non négociables doivent préciser un item demandé.',
          path: ['items'],
        });
      }
    }
  });

const CreatePlaceSchema = z.object({
  slug: slugSchema,
  name: z.string().min(1).max(120),
  world: z.enum(['overworld', 'nether']),
  coordinates: coordinateSchema,
  description: z.string().max(2000).nullable().optional(),
  owners: z.array(ownerSchema).optional(),
  tags: z.array(tagSchema).optional(),
  discordUrl: z.string().url().max(256).nullable().optional(),
  imageUrl: z.string().url().max(512).nullable().optional(),
  tradeOffers: z.array(tradeOfferSchema).optional(),
});

const sanitizeOwners = (owners?: string[]) =>
  Array.from(new Set((owners ?? []).map((owner) => owner.trim()).filter(Boolean)));

const sanitizeTags = (tags?: string[]) =>
  Array.from(new Set((tags ?? []).map((tag) => tag.trim()).filter(Boolean)));

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
