import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@/generated/prisma/client';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { appPreferencesSchema } from '@/lib/preferences';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Authentification requise.' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { preferences: true },
  });
  if (!user) {
    return NextResponse.json({ error: 'Compte introuvable.' }, { status: 404 });
  }
  return NextResponse.json({ preferences: user.preferences });
}

export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Authentification requise.' }, { status: 401 });
  }

  const payload = await parsePayload(request);
  if (!payload) {
    return NextResponse.json({ error: 'Préférences invalides.' }, { status: 400 });
  }

  const preferences = payload.preferences as Prisma.InputJsonValue;
  if (payload.initializeOnly) {
    await prisma.user.updateMany({
      where: { id: session.user.id, preferences: { equals: Prisma.DbNull } },
      data: { preferences },
    });
  } else {
    const result = await prisma.user.updateMany({
      where: { id: session.user.id },
      data: { preferences },
    });
    if (result.count === 0) {
      return NextResponse.json({ error: 'Compte introuvable.' }, { status: 404 });
    }
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { preferences: true },
  });
  if (!user) {
    return NextResponse.json({ error: 'Compte introuvable.' }, { status: 404 });
  }
  return NextResponse.json({ preferences: user.preferences });
}

async function parsePayload(request: NextRequest) {
  try {
    const body = await request.json() as Record<string, unknown>;
    const preferences = appPreferencesSchema.safeParse(body.preferences);
    if (!preferences.success || typeof body.initializeOnly !== 'boolean') return null;
    return { preferences: preferences.data, initializeOnly: body.initializeOnly };
  } catch {
    return null;
  }
}
