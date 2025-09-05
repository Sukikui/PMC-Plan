import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { Portal, Place } from '../app/api/utils/shared';

const readJsonFile = (filePath: string) => {
  return JSON.parse(readFileSync(filePath, 'utf-8'));
};

const loadAllJsonFromDir = (dirPath: string) => {
  const files = readdirSync(dirPath).filter(file => file.endsWith('.json'));
  return files.map(file => readJsonFile(join(dirPath, file)));
};

// Adjust paths based on your project structure
const PUBLIC_DATA_PATH = join(process.cwd(), 'public', 'data');
const PORTAL_EXAMPLES_PATH = join(PUBLIC_DATA_PATH, 'portal_examples');
const PLACE_EXAMPLES_PATH = join(PUBLIC_DATA_PATH, 'place_examples');

// Load test data from existing files
export const mockPortals: Portal[] = loadAllJsonFromDir(PORTAL_EXAMPLES_PATH);
export const mockPlaces: Place[] = loadAllJsonFromDir(PLACE_EXAMPLES_PATH);

// Helper functions to discover test scenarios from existing data
export const getPortalsByWorld = (world: 'overworld' | 'nether'): Portal[] => {
  return mockPortals.filter(portal => portal.world === world);
};

export const getPortalById = (id: string): Portal | undefined => {
  return mockPortals.find(portal => portal.id === id);
};

export const getPlaceById = (id: string): Place | undefined => {
  return mockPlaces.find(place => place.id === id);
};

// Find portal pairs (overworld + nether with same ID)
export const getPortalPairs = (): Array<{ overworld: Portal; nether: Portal | undefined }> => {
  const overworldPortals = getPortalsByWorld('overworld');
  return overworldPortals.map(owPortal => ({
    overworld: owPortal,
    nether: getPortalById(owPortal.id)
  }));
};

// Get test coordinates from existing data
export const getTestCoordinates = () => {
  const overworldPortals = getPortalsByWorld('overworld');
  const netherPortals = getPortalsByWorld('nether');
  
  return {
    overworld: overworldPortals.length > 0 ? overworldPortals[0].coordinates : { x: 0, y: 70, z: 0 },
    nether: netherPortals.length > 0 ? netherPortals[0].coordinates : { x: 0, y: 70, z: 0 },
    places: mockPlaces.length > 0 ? mockPlaces[0].coordinates : { x: 100, y: 70, z: 100 }
  };
};

// Generate route test scenarios based on existing data
export const generateRouteTestScenarios = () => {
  const scenarios = [];
  
  // Overworld to overworld
  if (mockPlaces.length >= 2) {
    scenarios.push({
      name: 'place-to-place-overworld',
      fromPlaceId: mockPlaces[0].id,
      toPlaceId: mockPlaces[1]?.id || mockPlaces[0].id
    });
  }
  
  // Using coordinates
  const testCoords = getTestCoordinates();
  scenarios.push({
    name: 'coordinates-overworld-to-overworld',
    from: { ...testCoords.overworld, world: 'overworld' },
    to: { x: testCoords.overworld.x + 100, y: testCoords.overworld.y, z: testCoords.overworld.z + 100, world: 'overworld' }
  });
  
  // Cross-dimensional if we have both worlds
  const overworldPortals = getPortalsByWorld('overworld');
  const netherPortals = getPortalsByWorld('nether');
  
  if (overworldPortals.length > 0 && netherPortals.length > 0) {
    scenarios.push({
      name: 'overworld-to-nether',
      from: { ...overworldPortals[0].coordinates, world: 'overworld' },
      to: { ...netherPortals[0].coordinates, world: 'nether' }
    });
  }
  
  return scenarios;
};
