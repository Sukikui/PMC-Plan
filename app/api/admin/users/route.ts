import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import {
  ADMIN_USERS_PAGE_SIZE,
  type AdminUsersResponse,
} from '@/lib/admin/users';
import { isAdministrationRole } from '@/lib/admin/roles';
import { getEffectiveRequestRole } from '@/lib/admin/request-role';

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
    ...(query && {
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { username: { contains: query, mode: 'insensitive' } },
        { minecraftProfile: { is: { name: { contains: query, mode: 'insensitive' } } } },
        { minecraftProfile: { is: { uuid: { contains: query, mode: 'insensitive' } } } },
      ],
    }),
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
      skip: (page - 1) * ADMIN_USERS_PAGE_SIZE,
      take: ADMIN_USERS_PAGE_SIZE,
      select: {
        id: true,
        name: true,
        username: true,
        image: true,
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
      id: user.id,
      name: user.name,
      username: user.username,
      image: user.image,
      role: user.role,
      minecraftUuid: user.minecraftProfile?.uuid ?? null,
      minecraftName: user.minecraftProfile?.name ?? null,
      minecraftLinkedAt: user.minecraftProfile?.linkedAt?.toISOString() ?? null,
      createdAt: user.createdAt.toISOString(),
    })),
    pagination: {
      page,
      pageSize: ADMIN_USERS_PAGE_SIZE,
      total,
      totalPages: Math.max(1, Math.ceil(total / ADMIN_USERS_PAGE_SIZE)),
    },
  };

  return NextResponse.json(response);
}
