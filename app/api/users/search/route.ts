import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import { getEffectiveRequestRole } from '@/lib/admin/request-role';
import { canContribute } from '@/lib/content-permissions';
import { normalizeDiscordUserQuery } from '@/lib/discord/user-search';
import {
  discordIdentitySelect,
  toPublicDiscordIdentity,
} from '@/lib/discord-user';
import { prisma } from '@/lib/prisma';
import type { MapEntryUser } from '@/lib/map-entry/types';

const querySchema = z.object({
  query: z.string()
    .transform(normalizeDiscordUserQuery)
    .pipe(z.string().min(2).max(100)),
});

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Authentification requise.' }, { status: 401 });
  }
  const actorRole = getEffectiveRequestRole(request, session.user.role);
  if (!canContribute(actorRole)) {
    return NextResponse.json({ error: 'Compte approuvé requis.' }, { status: 403 });
  }

  const parsed = querySchema.safeParse(
    Object.fromEntries(request.nextUrl.searchParams),
  );
  if (!parsed.success) {
    return NextResponse.json({ users: [] });
  }

  const users = await prisma.user.findMany({
    where: {
      role: { in: ['user', 'admin', 'super_admin'] },
      OR: [
        { discordDisplayName: { contains: parsed.data.query, mode: 'insensitive' } },
        { discordUsername: { contains: parsed.data.query, mode: 'insensitive' } },
      ],
    },
    orderBy: [{ discordDisplayName: 'asc' }, { discordUsername: 'asc' }],
    take: 8,
    select: {
      ...discordIdentitySelect,
      role: true,
      minecraftProfile: {
        select: { uuid: true, name: true },
      },
    },
  });

  return NextResponse.json({
    users: users.map((user) => ({
      ...toPublicDiscordIdentity(user),
      role: user.role,
      minecraftProfile: user.minecraftProfile,
    })) satisfies MapEntryUser[],
  });
}
