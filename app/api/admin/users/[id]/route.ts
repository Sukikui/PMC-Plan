import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { auth } from '@/auth';
import {
  canDeleteUserAccount,
  isAdministrationRole,
} from '@/lib/admin/roles';
import { getEffectiveRequestRole } from '@/lib/admin/request-role';
import {
  AdminUserDeletionError,
  countManagedContent,
  deleteUserAccount,
} from '@/lib/admin/user-deletion';
import { PRIMARY_MANAGEMENT_TRANSFER_REQUIRED } from '@/lib/admin/users';
import { prisma } from '@/lib/prisma';

interface RouteContext {
  params: Promise<{ id: string }>;
}

const deletionSchema = z.object({
  transferToUserId: z.string().min(1).optional(),
});

export async function DELETE(request: Request, context: RouteContext) {
  const session = await auth();
  const actorRole = getEffectiveRequestRole(request, session?.user?.role);
  if (!isAdministrationRole(actorRole) || !session?.user?.id) {
    return NextResponse.json(
      { error: 'Accès administrateur requis.' },
      { status: 403 },
    );
  }

  const { id } = await context.params;
  if (id === session.user.id) {
    return NextResponse.json(
      { error: 'Tu ne peux pas supprimer ton propre compte.' },
      { status: 403 },
    );
  }

  const target = await prisma.user.findUnique({
    where: { id },
    select: { role: true },
  });

  if (!target) {
    return NextResponse.json(
      { error: 'Utilisateur introuvable.' },
      { status: 404 },
    );
  }

  if (!canDeleteUserAccount(actorRole, target.role, false)) {
    return NextResponse.json(
      { error: 'Tu ne peux pas supprimer un compte de ce niveau.' },
      { status: 403 },
    );
  }

  const parsedBody = await parseDeletionBody(request);
  if (!parsedBody.success) {
    return NextResponse.json(
      { error: 'Paramètres de suppression invalides.' },
      { status: 400 },
    );
  }

  try {
    const result = await deleteUserAccount({
      actorUserId: session.user.id,
      expectedRole: target.role,
      targetUserId: id,
      transferToUserId: parsedBody.data.transferToUserId,
    });
    return NextResponse.json({
      ...result,
      message: 'Compte supprimé.',
    });
  } catch (error) {
    if (error instanceof AdminUserDeletionError) {
      return NextResponse.json(
        {
          error: error.message,
          code: error.code,
          primaryManagedContent: error.primaryManagedContent,
        },
        { status: error.status },
      );
    }
    if (
      error instanceof Prisma.PrismaClientKnownRequestError
      && error.code === 'P2003'
    ) {
      const [entries, spaces] = await Promise.all([
        prisma.mapEntry.findMany({
          where: { primaryManagerId: id },
          select: {
            place: { select: { uid: true } },
            portals: {
              select: { uid: true },
              take: 1,
            },
            service: { select: { uid: true } },
          },
        }),
        prisma.space.count({ where: { primaryManagerId: id } }),
      ]);
      return transferRequiredResponse(countManagedContent(entries, spaces));
    }
    throw error;
  }
}

async function parseDeletionBody(request: Request) {
  const rawBody = await request.text();
  if (!rawBody) return deletionSchema.safeParse({});
  try {
    return deletionSchema.safeParse(JSON.parse(rawBody));
  } catch {
    return deletionSchema.safeParse(null);
  }
}

function transferRequiredResponse(
  primaryManagedContent: {
    places: number;
    portals: number;
    services: number;
    spaces: number;
  },
) {
  return NextResponse.json(
    {
      error: 'Un nouveau gestionnaire principal doit être sélectionné.',
      code: PRIMARY_MANAGEMENT_TRANSFER_REQUIRED,
      primaryManagedContent,
    },
    { status: 409 },
  );
}
