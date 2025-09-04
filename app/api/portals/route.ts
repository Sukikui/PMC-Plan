import { NextRequest, NextResponse } from 'next/server';
import { 
  loadPortals, 
  findNearestPortals, 
  convertOverworldToNether, 
  Portal 
} from '../utils/shared';
import { callNetherAddress, callLinkedPortal } from '../route/route-utils';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mergeNetherPortals = searchParams.get('merge-nether-portals') === 'true';

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
                'overworld'
            );

            // Check if both conditions are met (same ID and recognized as linked)
            if (officialLinkedPortal && officialLinkedPortal.id === candidatePortal.id) {
                // If yes, associate them
                netherPortalsMap.delete(owPortal.id);

                const netherAddress = await callNetherAddress(
                    candidatePortal.coordinates.x,
                    candidatePortal.coordinates.y,
                    candidatePortal.coordinates.z
                );

                return {
                    ...owPortal,
                    'nether-associate': {
                        coordinates: candidatePortal.coordinates,
                        address: netherAddress.address || 'Unknown',
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
    console.error('Unexpected error loading portals:', error);
    return NextResponse.json({ 
      error: 'Unexpected server error',
      details: 'Une erreur inattendue est survenue lors du chargement des portails'
    }, { status: 500 });
  }
}
