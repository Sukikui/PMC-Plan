import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getEffectiveRequestRole } from '@/lib/admin/request-role';
import {
  canAdministerContent,
  canManageContent,
} from '@/lib/content-permissions';
import { prepareMapEntryUpdate } from '@/lib/map-entry/creation';
import { updateMapEntryManagement } from '@/lib/map-entry/management-update';
import { prisma } from '@/lib/prisma';
import { updateServiceSchema } from '@/lib/services/schemas';
import { serviceInclude, toService } from '@/lib/services/serialization';
import { getServiceWriteData } from '@/lib/services/write-data';
import { handleServiceApiError } from '../service-api';

interface ServiceRouteContext {
  params: Promise<{ slug: string }>;
}

export async function PUT(
  request: NextRequest,
  { params }: ServiceRouteContext,
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentification requise.' },
        { status: 401 },
      );
    }
    const { slug } = await params;
    const existing = await prisma.service.findUnique({
      where: { slug },
      include: {
        mapEntry: {
          select: {
            primaryManagerId: true,
            managers: { select: { userId: true } },
          },
        },
      },
    });
    if (!existing) {
      return NextResponse.json(
        { error: 'Service introuvable.' },
        { status: 404 },
      );
    }

    const actorRole = getEffectiveRequestRole(request, session.user.role);
    const access = {
      primaryManagerId: existing.mapEntry.primaryManagerId,
      managerIds: existing.mapEntry.managers.map(({ userId }) => userId),
    };
    if (!canManageContent(actorRole, session.user.id, access)) {
      return NextResponse.json({ error: 'Accès refusé.' }, { status: 403 });
    }

    const payload = updateServiceSchema.parse(await request.json());
    const management = payload.management
      ? await prepareMapEntryUpdate(payload.management)
      : null;
    const service = await prisma.$transaction(async (tx) => {
      await tx.service.update({
        where: { uid: existing.uid },
        data: getServiceWriteData(payload),
      });
      if (management) {
        await updateMapEntryManagement(
          tx,
          existing.mapEntryId,
          { userId: session.user.id, role: actorRole },
          management,
        );
      } else {
        await tx.mapEntry.update({
          where: { id: existing.mapEntryId },
          data: { lastEditorId: session.user.id },
        });
      }
      return tx.service.findUniqueOrThrow({
        where: { uid: existing.uid },
        include: serviceInclude,
      });
    });

    return NextResponse.json({ service: toService(service) });
  } catch (error) {
    return handleServiceApiError(
      error,
      'Impossible de modifier le service.',
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: ServiceRouteContext,
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentification requise.' },
        { status: 401 },
      );
    }
    const { slug } = await params;
    const service = await prisma.service.findUnique({
      where: { slug },
      select: {
        mapEntryId: true,
        mapEntry: { select: { primaryManagerId: true } },
      },
    });
    if (!service) {
      return NextResponse.json(
        { error: 'Service introuvable.' },
        { status: 404 },
      );
    }

    const actorRole = getEffectiveRequestRole(request, session.user.role);
    if (!canAdministerContent(
      actorRole,
      session.user.id,
      service.mapEntry.primaryManagerId,
    )) {
      return NextResponse.json({ error: 'Accès refusé.' }, { status: 403 });
    }

    await prisma.mapEntry.delete({ where: { id: service.mapEntryId } });
    return NextResponse.json({ message: 'Service supprimé.' });
  } catch (error) {
    return handleServiceApiError(
      error,
      'Impossible de supprimer le service.',
    );
  }
}
