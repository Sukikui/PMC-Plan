import { Prisma } from '@prisma/client';
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { auth } from '@/auth';
import { getEffectiveRequestRole } from '@/lib/admin/request-role';
import { SpaceError } from '@/lib/spaces/service';
import type { SpaceActor } from '@/lib/spaces/types';

export async function getSpaceActor(
  request: Request,
): Promise<SpaceActor | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  return {
    userId: session.user.id,
    role: getEffectiveRequestRole(request, session.user.role),
  };
}

export function spaceErrorResponse(error: unknown) {
  if (error instanceof SpaceError) {
    return NextResponse.json(
      { error: error.message },
      { status: error.status },
    );
  }
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: 'Les informations de l’espace sont invalides.',
        details: error.flatten(),
      },
      { status: 400 },
    );
  }
  if (
    error instanceof Prisma.PrismaClientKnownRequestError
    && error.code === 'P2002'
  ) {
    return NextResponse.json(
      { error: 'Ce slug est déjà utilisé par un autre espace.' },
      { status: 409 },
    );
  }
  throw error;
}
