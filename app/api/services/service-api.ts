import { Prisma } from '@prisma/client';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { MapEntryError } from '@/lib/map-entry/service';
import { MinecraftProfileError } from '@/lib/minecraft/profiles';

export function handleServiceApiError(
  error: unknown,
  fallbackMessage: string,
) {
  if (error instanceof z.ZodError) {
    return NextResponse.json(
      { error: error.issues[0]?.message ?? 'Requête invalide.' },
      { status: 400 },
    );
  }
  if (
    error instanceof Prisma.PrismaClientKnownRequestError
    && error.code === 'P2002'
  ) {
    return NextResponse.json(
      { error: 'Un service avec cet identifiant existe déjà.' },
      { status: 409 },
    );
  }
  if (error instanceof MinecraftProfileError || error instanceof MapEntryError) {
    return NextResponse.json(
      { error: error.message },
      { status: error.status },
    );
  }
  console.error(fallbackMessage, error);
  return NextResponse.json({ error: fallbackMessage }, { status: 500 });
}
