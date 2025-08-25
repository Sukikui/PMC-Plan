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

      const processedPortals: Portal[] = await Promise.all(overworldPortals.map(async (owPortal) => {
        const netherCoords = convertOverworldToNether(owPortal.coordinates.x, owPortal.coordinates.z);
        
        const nearestPortals = await findNearestPortals(
          netherCoords.x, 
          owPortal.coordinates.y, // Y is not converted
          netherCoords.z, 
          'nether',
          150 // Search within a 150 block radius
        );

        const linkedPortal = nearestPortals.find(np => np.name === owPortal.name);

        if (linkedPortal) {
          const netherAddress = await calculateNetherAddress(
            linkedPortal.coordinates.x, 
            linkedPortal.coordinates.y, 
            linkedPortal.coordinates.z
          );

          return {
            ...owPortal,
            'nether-associate': {
              id: linkedPortal.id,
              coordinates: linkedPortal.coordinates,
              address: netherAddress.address
            }
          };
        }
        
        return owPortal;
      }));

      return NextResponse.json([ ...processedPortals, ...netherPortals ]);
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
