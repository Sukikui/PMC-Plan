import { NextRequest, NextResponse } from 'next/server';
import { 
  loadPortals, 
  Portal,
  calculateNetherAddress
} from '../utils/shared';
import { callLinkedPortal } from '../route/route-utils';
import { handleError, parseQueryParams, sanitizeOwners } from '../utils/api-utils';
import { z } from 'zod';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

const QuerySchema = z.object({
  'merge-nether-portals': z.coerce.boolean().optional().default(false),
});

export async function GET(request: NextRequest) {
  try {
    const { 'merge-nether-portals': mergeNetherPortals } = parseQueryParams(request.url, QuerySchema);

    const portals = await loadPortals();

    if (mergeNetherPortals) {
      const overworldPortals = portals.filter(p => p.world === 'overworld');
      const netherPortals = portals.filter(p => p.world === 'nether');
      const netherPortalsMap = new Map(netherPortals.map(p => [p.id, p]));

      const processedPortals: Portal[] = await Promise.all(overworldPortals.map(async owPortal => {
        // Condition 1: Find candidate portal by shared ID
        const candidatePortal = netherPortalsMap.get(owPortal.id);

        if (candidatePortal) {
            // Condition 2: Check if it's the "official" linked portal
            const officialLinkedPortal = await callLinkedPortal(
                owPortal.coordinates.x,
                owPortal.coordinates.y,
                owPortal.coordinates.z,
                'overworld',
                portals
            );

            // Check if both conditions are met (same ID and recognized as linked)
            if (officialLinkedPortal && officialLinkedPortal.id === candidatePortal.id) {
                // If yes, associate them
                netherPortalsMap.delete(owPortal.id);

                return {
                    ...owPortal,
                    'nether-associate': {
                        coordinates: candidatePortal.coordinates,
                        address: candidatePortal.address,
                        description: candidatePortal.description
                    }
                };
            }
        }
        
        // If conditions are not met, return the overworld portal as is
        return owPortal;
      }));

      // The remaining portals in the map are the un-associated nether portals
      const unassociatedNetherPortals = Array.from(netherPortalsMap.values());

      return NextResponse.json([...processedPortals, ...unassociatedNetherPortals]);
    }

    return NextResponse.json(portals);

  } catch (error) {
    return handleError(error, 'Unexpected server error');
  }
}

import { CreatePortalSchema } from '../utils/schemas';



export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentification requise.' }, { status: 401 });
    }

    const json = await request.json();
    const payload = CreatePortalSchema.parse(json);
    const userId = session.user.id;

    if (payload.mode === 'single') {
      const owners = sanitizeOwners(payload.portal.ownerNames);
      const slugValue = payload.portal.slug.toLowerCase();
      let address = payload.portal.address?.trim() || null;

      if (payload.portal.world === 'nether' && !address) {
        const netherAddress = await calculateNetherAddress(
          payload.portal.coordinates.x,
          payload.portal.coordinates.y,
          payload.portal.coordinates.z
        );
        address = netherAddress.address ?? null;
      }

      const created = await prisma.portal.create({
        data: {
          slug: slugValue,
          name: payload.portal.name,
          world: payload.portal.world,
          coordX: payload.portal.coordinates.x,
          coordY: payload.portal.coordinates.y,
          coordZ: payload.portal.coordinates.z,
          description: payload.portal.description ?? null,
          address,
          ownerNames: owners,
          status: 'pending',
          createdById: userId,
        },
      });

      return NextResponse.json(
        {
          portals: [
            {
              slug: created.slug,
              world: created.world,
              name: created.name,
            },
          ],
        },
        { status: 201 }
      );
    }

    // linked portals
    const owners = sanitizeOwners(payload.owners);
    const slugValue = payload.slug.toLowerCase();
    let netherAddress = payload.nether.address?.trim() || null;

    if (!netherAddress) {
      const netherComputed = await calculateNetherAddress(
        payload.nether.coordinates.x,
        payload.nether.coordinates.y,
        payload.nether.coordinates.z
      );
      netherAddress = netherComputed.address ?? null;
    }

    const result = await prisma.$transaction(async (tx) => {
      const overworldPortal = await tx.portal.create({
        data: {
          slug: slugValue,
          name: payload.name,
          world: 'overworld',
          coordX: payload.overworld.coordinates.x,
          coordY: payload.overworld.coordinates.y,
          coordZ: payload.overworld.coordinates.z,
          description: payload.overworld.description ?? null,
          address: null,
          ownerNames: owners,
          status: 'pending',
          createdById: userId,
        },
      });

      const netherPortal = await tx.portal.create({
        data: {
          slug: slugValue,
          name: payload.name,
          world: 'nether',
          coordX: payload.nether.coordinates.x,
          coordY: payload.nether.coordinates.y,
          coordZ: payload.nether.coordinates.z,
          description: payload.nether.description ?? null,
          address: netherAddress,
          ownerNames: owners,
          status: 'pending',
          createdById: userId,
        },
      });

      return { overworldPortal, netherPortal };
    });

    return NextResponse.json(
      {
        portals: [
            {
              slug: result.overworldPortal.slug,
              world: result.overworldPortal.world,
              name: result.overworldPortal.name,
            },
            {
              slug: result.netherPortal.slug,
              world: result.netherPortal.world,
              name: result.netherPortal.name,
            },
        ],
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? 'Requête invalide.' }, { status: 400 });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json({ error: 'Un portail avec ce slug existe déjà pour ce monde.' }, { status: 409 });
    }
    return handleError(error, 'Impossible de créer le portail');
  }
}
