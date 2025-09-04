import { NextRequest, NextResponse } from 'next/server';
import { 
  loadPortals, 
  findNearestPortals, 
  convertOverworldToNether, 
  Portal 
} from '../utils/shared';
import { callNetherAddress } from '../route/route-utils';

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
        const linkedPortal = netherPortalsMap.get(owPortal.id);
        if (linkedPortal) {
          netherPortalsMap.delete(owPortal.id);
          // Calculate address for the linked nether portal
          const netherAddress = await callNetherAddress(
            linkedPortal.coordinates.x,
            linkedPortal.coordinates.y,
            linkedPortal.coordinates.z
          );
          return {
            ...owPortal,
            'nether-associate': {
              id: linkedPortal.id,
              coordinates: linkedPortal.coordinates,
              address: netherAddress.address || 'Unknown' // Use 'Unknown' if address is not available
            }
          };
        }
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
