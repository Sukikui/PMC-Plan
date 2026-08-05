import { NextRequest, NextResponse } from 'next/server';
import { ServiceContactType } from '@prisma/client';
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
import { getPagination } from '@/lib/api/pagination';
import { loadServiceList } from '@/lib/services/list-server';
import { invalidateServicePublicData } from '@/lib/content/cache-tags';

export async function GET(request: NextRequest) {
  try {
    if (request.nextUrl.searchParams.get('view') === 'summary') {
      const { page, pageSize } = getPagination(
        request.nextUrl.searchParams,
        30,
      );
      const query = request.nextUrl.searchParams.get('q')?.trim() ?? '';
      const requestedContact = request.nextUrl.searchParams.get('contact');
      const contactType = Object.values(ServiceContactType).includes(
        requestedContact as ServiceContactType,
      ) ? requestedContact as ServiceContactType : null;
      return NextResponse.json(
        await loadServiceList(contactType, page, pageSize, query),
      );
    }
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
    invalidateServicePublicData(service.slug);

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
