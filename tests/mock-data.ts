import type { Place, Portal } from '../app/api/utils/shared';

const fixtureDate = new Date('2024-01-01T00:00:00.000Z');

const baseEntity = {
  createdById: 'test-user',
  createdAt: fixtureDate,
  updatedAt: fixtureDate,
};

export const mockPortals: Portal[] = [
  {
    ...baseEntity,
    id: 'portail_spawn',
    slug: 'portail_spawn',
    name: 'Portail du Spawn',
    world: 'overworld',
    coordinates: { x: -160, y: 70, z: 240 },
    description: "Point central de l'autoroute aménagée du Nether",
    address: '',
    owners: [],
    'nether-associate': null,
  },
  {
    ...baseEntity,
    id: 'portail_spawn',
    slug: 'portail_spawn',
    name: 'Portail du Spawn',
    world: 'nether',
    coordinates: { x: -20, y: 70, z: 29 },
    description: null,
    address: 'Spawn',
    owners: [],
    'nether-associate': null,
  },
  {
    ...baseEntity,
    id: 'portail_village_suki',
    slug: 'portail_village_suki',
    name: 'Portail du village de Suki',
    world: 'overworld',
    coordinates: { x: 4520, y: 70, z: 280 },
    description: "Donne l'accès sur l'entrée principale du village de Suki.",
    address: '',
    owners: [],
    'nether-associate': null,
  },
  {
    ...baseEntity,
    id: 'portail_village_suki',
    slug: 'portail_village_suki',
    name: 'Portail du village de Suki',
    world: 'nether',
    coordinates: { x: 563, y: 60, z: 34 },
    description: null,
    address: 'Est 7 droite',
    owners: [],
    'nether-associate': null,
  },
];

export const mockPlaces: Place[] = [
  {
    ...baseEntity,
    id: 'spawn_overworld',
    name: 'Spawn Overworld',
    world: 'overworld',
    category: 'zone_communautaire',
    coordinates: { x: 0, y: 70, z: 0 },
    tags: ['spawn', 'test'],
    description: 'Point de spawn du serveur pour les tests',
    address: null,
    images: [],
    owners: [],
    discord: null,
    trade: null,
  },
  {
    ...baseEntity,
    id: 'village_suki',
    name: 'Village de Suki',
    world: 'overworld',
    category: 'construction',
    coordinates: { x: 5000, y: 70, z: 300 },
    tags: ['village', 'base'],
    description: 'Ancien village caché au sein duquel de nombreux secrets et trésors sont gardés à tout jamais...',
    address: null,
    images: [],
    owners: ['Suki'],
    discord: 'https://discord.gg/exemple123',
    trade: [
      {
        gives: {
          custom_name: 'Gemme de vitalité',
          item_id: 'emerald',
          quantity: 5,
          enchanted: true,
        },
        wants: {
          custom_name: null,
          item_id: 'diamond',
          quantity: 1,
          enchanted: false,
        },
        negotiable: false,
      },
    ],
  },
  {
    ...baseEntity,
    id: 'base_nether',
    name: 'Base Nether',
    world: 'nether',
    category: 'construction',
    coordinates: { x: 300, y: 70, z: 300 },
    address: 'Sud-Est 5',
    tags: ['base', 'nether'],
    description: 'Base établie dans le Nether pour les tests',
    images: [],
    owners: ['TestUser'],
    discord: null,
    trade: null,
  },
];

export const getPortalsByWorld = (world: 'overworld' | 'nether'): Portal[] =>
  mockPortals.filter((portal) => portal.world === world);

export const getPortalById = (id: string, world?: 'overworld' | 'nether'): Portal | undefined =>
  mockPortals.find((portal) => portal.id === id && (!world || portal.world === world));

export const getPlaceById = (id: string): Place | undefined =>
  mockPlaces.find((place) => place.id === id);

export const getPortalPairs = (): Array<{ overworld: Portal; nether: Portal | undefined }> =>
  getPortalsByWorld('overworld').map((overworld) => ({
    overworld,
    nether: getPortalById(overworld.id, 'nether'),
  }));

export const getTestCoordinates = () => {
  const overworldPortals = getPortalsByWorld('overworld');
  const netherPortals = getPortalsByWorld('nether');

  return {
    overworld: overworldPortals[0]?.coordinates ?? { x: 0, y: 70, z: 0 },
    nether: netherPortals[0]?.coordinates ?? { x: 0, y: 70, z: 0 },
    places: mockPlaces[0]?.coordinates ?? { x: 100, y: 70, z: 100 },
  };
};

export const generateRouteTestScenarios = () => {
  const scenarios = [];

  if (mockPlaces.length >= 2) {
    scenarios.push({
      name: 'place-to-place-overworld',
      fromPlaceId: mockPlaces[0].id,
      toPlaceId: mockPlaces[1]?.id || mockPlaces[0].id,
    });
  }

  const testCoords = getTestCoordinates();
  scenarios.push({
    name: 'coordinates-overworld-to-overworld',
    from: { ...testCoords.overworld, world: 'overworld' },
    to: {
      x: testCoords.overworld.x + 100,
      y: testCoords.overworld.y,
      z: testCoords.overworld.z + 100,
      world: 'overworld',
    },
  });

  const overworldPortals = getPortalsByWorld('overworld');
  const netherPortals = getPortalsByWorld('nether');

  if (overworldPortals.length > 0 && netherPortals.length > 0) {
    scenarios.push({
      name: 'overworld-to-nether',
      from: { ...overworldPortals[0].coordinates, world: 'overworld' },
      to: { ...netherPortals[0].coordinates, world: 'nether' },
    });
  }

  return scenarios;
};
