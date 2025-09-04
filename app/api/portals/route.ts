import { NextRequest, NextResponse } from 'next/server';
import { 
  loadPortals, 
  Portal,
  calculateNetherAddress
} from '../utils/shared';
import { callLinkedPortal } from '../route/route-utils';
import { handleError, parseQueryParams } from '../utils/api-utils';
import { z } from 'zod';

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

                const netherAddress = await calculateNetherAddress(
                    candidatePortal.coordinates.x,
                    candidatePortal.coordinates.y,
                    candidatePortal.coordinates.z
                );

                if (!netherAddress.address) {
                    throw new Error(`Failed to calculate nether address for portal ${candidatePortal.id} at coordinates (${candidatePortal.coordinates.x}, ${candidatePortal.coordinates.y}, ${candidatePortal.coordinates.z})`);
                }

                return {
                    ...owPortal,
                    'nether-associate': {
                        coordinates: candidatePortal.coordinates,
                        address: netherAddress.address,
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
