import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import {
  ASSIGNABLE_ROLES,
  canAssignRole,
  isAdministrationRole,
} from '@/lib/admin/roles';
import { getEffectiveRequestRole } from '@/lib/admin/request-role';
import { prisma } from '@/lib/prisma';

const updateRoleSchema = z.object({
  role: z.enum(ASSIGNABLE_ROLES),
});

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const session = await auth();
  const actorRole = getEffectiveRequestRole(request, session?.user?.role);
  if (!isAdministrationRole(actorRole)) {
    return NextResponse.json(
      { error: 'Accès administrateur requis.' },
      { status: 403 },
    );
  }

  const payload = await parsePayload(request);
  if (!payload) {
    return NextResponse.json({ error: 'Rôle invalide.' }, { status: 400 });
  }

  const { id } = await context.params;
  const target = await prisma.user.findUnique({
    where: { id },
    select: { role: true },
  });

  if (!target) {
    return NextResponse.json({ error: 'Utilisateur introuvable.' }, { status: 404 });
  }

  if (!canAssignRole(actorRole, target.role, payload.role)) {
    return NextResponse.json(
      { error: 'Cette modification de rôle n’est pas autorisée.' },
      { status: 403 },
    );
  }

  const user = await prisma.user.update({
    where: { id },
    data: { role: payload.role },
    select: { id: true, role: true },
  });

  return NextResponse.json({ user });
}

async function parsePayload(request: NextRequest) {
  try {
    const parsed = updateRoleSchema.safeParse(await request.json());
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}
