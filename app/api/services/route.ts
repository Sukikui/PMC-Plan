import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getEffectiveRequestRole } from '@/lib/admin/request-role';
import { canContribute } from '@/lib/content-permissions';
import { prepareMapEntryCreation } from '@/lib/map-entry/creation';
import { createMapEntry } from '@/lib/map-entry/service';
import { prisma } from '@/lib/prisma';
import { createServiceSchema } from '@/lib/services/schemas';
import { serviceInclude, toService } from '@/lib/services/serialization';
import { getServiceWriteData } from '@/lib/services/write-data';
import { handleServiceApiError } from './service-api';

export async function GET() {
  try {
    const services = await prisma.service.findMany({
      include: serviceInclude,
      orderBy: { name: 'asc' },
    });
    return NextResponse.json({ services: services.map(toService) });
  } catch (error) {
    return handleServiceApiError(
      error,
      'Impossible de charger les services.',
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentification requise.' },
        { status: 401 },
      );
    }
    const actorRole = getEffectiveRequestRole(request, session.user.role);
    if (!canContribute(actorRole)) {
      return NextResponse.json(
        {
          error: 'Ton compte doit être approuvé avant de pouvoir créer un service.',
        },
        { status: 403 },
      );
    }

    const payload = createServiceSchema.parse(await request.json());
    const management = await prepareMapEntryCreation(payload.management);
    const service = await prisma.$transaction(async (tx) => {
      const mapEntry = await createMapEntry(tx, session.user.id, management);
      return tx.service.create({
        data: {
          ...getServiceWriteData(payload),
          mapEntryId: mapEntry.id,
        },
        include: serviceInclude,
      });
    });

    return NextResponse.json(
      { service: toService(service) },
      { status: 201 },
    );
  } catch (error) {
    return handleServiceApiError(
      error,
      'Impossible de créer le service.',
    );
  }
}
