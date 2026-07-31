import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import { getEffectiveRequestRole } from '@/lib/admin/request-role';
import { canContribute } from '@/lib/content-permissions';
import {
  MinecraftProfileError,
  resolveMinecraftProfile,
} from '@/lib/minecraft/profiles';

const requestSchema = z.object({
  name: z.string().trim().min(3).max(16),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Authentification requise.' }, { status: 401 });
  }
  const actorRole = getEffectiveRequestRole(request, session.user.role);
  if (!canContribute(actorRole)) {
    return NextResponse.json({ error: 'Compte approuvé requis.' }, { status: 403 });
  }

  try {
    const { name } = requestSchema.parse(await request.json());
    return NextResponse.json(await resolveMinecraftProfile(name));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Ce pseudo Minecraft est invalide.' }, { status: 400 });
    }
    if (error instanceof MinecraftProfileError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json(
      { error: 'Impossible de vérifier ce compte Minecraft.' },
      { status: 500 },
    );
  }
}
