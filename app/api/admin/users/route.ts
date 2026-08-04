import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import {
  type AdminUsersResponse,
} from '@/lib/admin/users';
import { MANAGEMENT_LIST_PAGE_SIZE } from '@/lib/management/pagination';
import { isAdministrationRole } from '@/lib/admin/roles';
import { getEffectiveRequestRole } from '@/lib/admin/request-role';
import { normalizeDiscordUserQuery } from '@/lib/discord/user-search';
import {
  discordIdentitySelect,
  toPublicDiscordIdentity,
} from '@/lib/discord-user';

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  query: z.string().trim().max(100).default(''),
  role: z.enum(['all', 'pending', 'administrators']).default('all'),
});

export async function GET(request: NextRequest) {
  const session = await auth();
  const actorRole = getEffectiveRequestRole(request, session?.user?.role);
  if (!isAdministrationRole(actorRole)) {
    return NextResponse.json({ error: 'Accès administrateur requis.' }, { status: 403 });
  }

  const parsedQuery = querySchema.safeParse(
    Object.fromEntries(request.nextUrl.searchParams),
  );
  if (!parsedQuery.success) {
    return NextResponse.json({ error: 'Paramètres de recherche invalides.' }, { status: 400 });
  }

  const { page, query, role } = parsedQuery.data;
  const where: Prisma.UserWhereInput = {
    ...(query && { OR: getUserSearchFilters(query) }),
    ...(role === 'administrators' && {
      role: { in: ['admin', 'super_admin'] },
    }),
    ...(role === 'pending' && {
      role: 'pending',
    }),
  };

  const [users, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * MANAGEMENT_LIST_PAGE_SIZE,
      take: MANAGEMENT_LIST_PAGE_SIZE,
      select: {
        ...discordIdentitySelect,
        role: true,
        minecraftProfile: {
          select: {
            uuid: true,
            name: true,
            linkedAt: true,
          },
        },
        createdAt: true,
      },
    }),
    prisma.user.count({ where }),
  ]);

  const response: AdminUsersResponse = {
    users: users.map((user) => ({
      ...toPublicDiscordIdentity(user),
      role: user.role,
      minecraftUuid: user.minecraftProfile?.uuid ?? null,
      minecraftName: user.minecraftProfile?.name ?? null,
      minecraftLinkedAt: user.minecraftProfile?.linkedAt?.toISOString() ?? null,
      createdAt: user.createdAt.toISOString(),
    })),
    pagination: {
      page,
      pageSize: MANAGEMENT_LIST_PAGE_SIZE,
      total,
      totalPages: Math.max(1, Math.ceil(total / MANAGEMENT_LIST_PAGE_SIZE)),
    },
  };

  return NextResponse.json(response);
}

function getUserSearchFilters(query: string): Prisma.UserWhereInput[] {
  const text = { contains: query, mode: Prisma.QueryMode.insensitive };
  const discordQuery = normalizeDiscordUserQuery(query);
  const filters: Prisma.UserWhereInput[] = [
    { discordDisplayName: text },
    { id: text },
    { minecraftProfile: { is: { name: text } } },
    { minecraftProfile: { is: { uuid: text } } },
  ];

  if (discordQuery) {
    filters.push({
      discordUsername: {
        contains: discordQuery,
        mode: Prisma.QueryMode.insensitive,
      },
    });
  }
  if (matchesDisplayedLabel('Utilisateur', query)) {
    filters.push({ discordDisplayName: null });
  }
  if (matchesDisplayedLabel('Non lié', query)) {
    filters.push({ minecraftProfile: { is: null } });
  }
  return filters;
}

function matchesDisplayedLabel(label: string, query: string) {
  const normalize = (value: string) => value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('fr');
  return normalize(label).includes(normalize(query));
}
