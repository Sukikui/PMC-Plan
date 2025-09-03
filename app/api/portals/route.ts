import { NextRequest, NextResponse } from 'next/server';
import { 
  loadPortals, 
  findNearestPortals, 
  calculateNetherAddress, 
  convertOverworldToNether, 
  Portal 
} from '../utils/shared';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mergeNetherPortals = searchParams.get('merge-nether-portals') === 'true';

    const portals = await loadPortals();

    if (mergeNetherPortals) {
      const overworldPortals = portals.filter(p => p.world === 'overworld');
      const netherPortals = portals.filter(p => p.world === 'nether');
      const netherPortalsMap = new Map(netherPortals.map(p => [p.id, p]));

      const processedPortals: Portal[] = overworldPortals.map(owPortal => {
        const linkedPortal = netherPortalsMap.get(owPortal.id);
        if (linkedPortal) {
          // Mark the linked portal as used by removing it from the map
          netherPortalsMap.delete(owPortal.id);
          const { id, world, ...associate } = linkedPortal;
          return {
            ...owPortal,
            'nether-associate': associate
          };
        }
        return owPortal;
      });

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
