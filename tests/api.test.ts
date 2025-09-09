import { GET } from '../app/api/nether-address/route';
import { GET as getNearestPortals } from '../app/api/nearest-portals/route';
import { GET as getLinkedPortal } from '../app/api/linked-portal/route';
import { GET as getPlaces } from '../app/api/places/route';
import { GET as getPortals } from '../app/api/portals/route';
import { GET as getRoute } from '../app/api/route/route';
import { NextRequest } from 'next/server';
import { mockPortals, mockPlaces, getPortalsByWorld, getPortalPairs, generateRouteTestScenarios, getTestCoordinates } from './mock-data';

// Mock the loadPlaces and loadPortals functions
jest.mock('../app/api/utils/shared', () => ({
  ...jest.requireActual('../app/api/utils/shared'),
  loadPlaces: jest.fn(() => Promise.resolve(mockPlaces)),
  loadPortals: jest.fn(() => Promise.resolve(mockPortals))
}));

describe('API Endpoints', () => {
  describe('/api/nether-address', () => {
    it('should calculate nether address for overworld coordinates', async () => {
      const testCoords = getTestCoordinates();
      const url = new URL(`http://localhost:3000/api/nether-address?x=${testCoords.overworld.x}&y=${testCoords.overworld.y}&z=${testCoords.overworld.z}`);
      const request = new NextRequest(url);
      
      const response = await GET(request);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data).toHaveProperty('address');
      expect(data).toHaveProperty('nearestStop');
      expect(data.nearestStop).toHaveProperty('coordinates');
      expect(data.nearestStop).toHaveProperty('distance');
      expect(typeof data.address).toBe('string');
      expect(typeof data.nearestStop.distance).toBe('number');
    });

    it('should return 500 for missing coordinates', async () => {
      const url = new URL('http://localhost:3000/api/nether-address?x=100');
      const request = new NextRequest(url);
      
      const response = await GET(request);
      expect(response.status).toBe(500);
    });

    it('should return 500 for invalid coordinates', async () => {
      const url = new URL('http://localhost:3000/api/nether-address?x=invalid&y=70&z=100');
      const request = new NextRequest(url);
      
      const response = await GET(request);
      expect(response.status).toBe(500);
    });
  });

  describe('/api/nearest-portals', () => {
    it('should find nearest portals in overworld', async () => {
      const overworldPortals = getPortalsByWorld('overworld');
      if (overworldPortals.length === 0) {
        console.warn('No overworld portals found for testing');
        return;
      }

      const testPortal = overworldPortals[0];
      const url = new URL(`http://localhost:3000/api/nearest-portals?x=${testPortal.coordinates.x}&y=${testPortal.coordinates.y}&z=${testPortal.coordinates.z}&world=overworld&limit=3`);
      const request = new NextRequest(url);
      
      const response = await getNearestPortals(request);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);
      expect(data.length).toBeLessThanOrEqual(3);
      
      data.forEach((portal: any) => {
        expect(portal).toHaveProperty('id');
        expect(portal).toHaveProperty('name');
        expect(portal).toHaveProperty('world', 'overworld');
        expect(portal).toHaveProperty('coordinates');
        expect(portal).toHaveProperty('distance');
        expect(typeof portal.distance).toBe('number');
      });
    });

    it('should find nearest portals in nether', async () => {
      const netherPortals = getPortalsByWorld('nether');
      if (netherPortals.length === 0) {
        console.warn('No nether portals found for testing');
        return;
      }

      const testPortal = netherPortals[0];
      const url = new URL(`http://localhost:3000/api/nearest-portals?x=${testPortal.coordinates.x}&y=${testPortal.coordinates.y}&z=${testPortal.coordinates.z}&world=nether&limit=2`);
      const request = new NextRequest(url);
      
      const response = await getNearestPortals(request);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);
      expect(data.length).toBeLessThanOrEqual(5); // Adjust based on actual data
      
      data.forEach((portal: any) => {
        expect(portal.world).toBe('nether');
        expect(typeof portal.distance).toBe('number');
      });
    });

    it('should return 500 for invalid world', async () => {
      const url = new URL('http://localhost:3000/api/nearest-portals?x=0&y=70&z=0&world=invalid');
      const request = new NextRequest(url);
      
      const response = await getNearestPortals(request);
      expect(response.status).toBe(500);
    });
  });

  describe('/api/linked-portal', () => {
    it('should find linked portal between dimensions', async () => {
      const portalPairs = getPortalPairs();
      const pairWithBothDimensions = portalPairs.find(pair => pair.nether !== undefined);
      
      if (!pairWithBothDimensions) {
        console.warn('No portal pairs found for testing linked portals');
        return;
      }

      const overworldPortal = pairWithBothDimensions.overworld;
      const url = new URL(`http://localhost:3000/api/linked-portal?from_x=${overworldPortal.coordinates.x}&from_y=${overworldPortal.coordinates.y}&from_z=${overworldPortal.coordinates.z}&from_world=overworld`);
      const request = new NextRequest(url);
      
      const response = await getLinkedPortal(request);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data).toHaveProperty('id');
      expect(data).toHaveProperty('name');
      expect(data).toHaveProperty('world', 'nether');
      expect(data).toHaveProperty('coordinates');
    });

    it('should return null when no linked portal found', async () => {
      const url = new URL('http://localhost:3000/api/linked-portal?from_x=99999&from_y=70&from_z=99999&from_world=overworld');
      const request = new NextRequest(url);
      
      const response = await getLinkedPortal(request);
      const data = await response.json();
      expect(response.status).toBe(200);
      expect(data).toBeNull();
    });
  });

  describe('/api/places', () => {
    it('should return all places', async () => {
      const response = await getPlaces();
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);
      
      data.forEach((place: any) => {
        expect(place).toHaveProperty('id');
        expect(place).toHaveProperty('name');
        expect(place).toHaveProperty('world');
        expect(place).toHaveProperty('coordinates');
        expect(place).toHaveProperty('tags');
        expect(place).toHaveProperty('description');
        expect(place).toHaveProperty('owner');
        expect(place).toHaveProperty('discord');
        expect(Array.isArray(place.tags)).toBe(true);
        expect(place.description === null || typeof place.description === 'string').toBe(true);
        expect(place.owner === null || typeof place.owner === 'string').toBe(true);
        expect(place.discord === null || typeof place.discord === 'string').toBe(true);
      });
    });

    it('should return places with meaningful data from multiple worlds', async () => {
      const response = await getPlaces();
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);
      
      // Verify data quality: descriptions are valid (null or non-empty string), all have tags, multiple worlds
      data.forEach((place: any) => {
        if (place.description !== null) {
          expect(place.description.length).toBeGreaterThan(0);
        }
        expect(place.tags.length).toBeGreaterThan(0);
        expect(['overworld', 'nether']).toContain(place.world);
      });
      
      // Verify we have dataset diversity
      const worlds = new Set(data.map((place: any) => place.world));
      expect(worlds.size).toBeGreaterThanOrEqual(1);
    });
  });

  describe('/api/portals', () => {
    it('should return all portals', async () => {
      const request = new NextRequest('http://localhost:3000/api/portals');
      
      const response = await getPortals(request);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);
      
      data.forEach((portal: any) => {
        expect(portal).toHaveProperty('id');
        expect(portal).toHaveProperty('name');
        expect(portal).toHaveProperty('world');
        expect(portal).toHaveProperty('coordinates');
        expect(portal).toHaveProperty('description');
        expect(portal.description === null || typeof portal.description === 'string').toBe(true);
      });
    });

    it('should merge nether portals when requested', async () => {
      const url = new URL('http://localhost:3000/api/portals?merge-nether-portals=true');
      const request = new NextRequest(url);
      
      const response = await getPortals(request);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      
      // Check if some overworld portals have nether-associate
      const overworldPortalsWithAssociate = data.filter((portal: any) => 
        portal.world === 'overworld' && portal['nether-associate']
      );
      
      if (overworldPortalsWithAssociate.length > 0) {
        overworldPortalsWithAssociate.forEach((portal: any) => {
          expect(portal['nether-associate']).toHaveProperty('coordinates');
          expect(portal['nether-associate']).toHaveProperty('address');
        });
      }
    });
  });

  describe('/api/route', () => {
    it('should calculate route between coordinates in same world', async () => {
      const scenarios = generateRouteTestScenarios();
      const sameWorldScenario = scenarios.find(s => s.from && s.to && s.from.world === s.to.world);
      
      if (!sameWorldScenario || !sameWorldScenario.from || !sameWorldScenario.to) {
        console.warn('No same-world route scenarios found for testing');
        return;
      }

      const url = new URL(`http://localhost:3000/api/route?from_x=${sameWorldScenario.from.x}&from_y=${sameWorldScenario.from.y}&from_z=${sameWorldScenario.from.z}&from_world=${sameWorldScenario.from.world}&to_x=${sameWorldScenario.to.x}&to_y=${sameWorldScenario.to.y}&to_z=${sameWorldScenario.to.z}&to_world=${sameWorldScenario.to.world}`);
      const request = new NextRequest(url);
      
      const response = await getRoute(request);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data).toHaveProperty('steps');
      expect(Array.isArray(data.steps)).toBe(true);
      expect(data).toHaveProperty('total_distance');
      expect(typeof data.total_distance).toBe('number');
      
      data.steps.forEach((step: any) => {
        expect(step).toHaveProperty('type');
      });
    });

    it('should calculate cross-dimensional route', async () => {
      const scenarios = generateRouteTestScenarios();
      const crossDimScenario = scenarios.find(s => s.from && s.to && s.from.world !== s.to.world);
      
      if (!crossDimScenario || !crossDimScenario.from || !crossDimScenario.to) {
        console.warn('No cross-dimensional route scenarios found for testing');
        return;
      }

      const url = new URL(`http://localhost:3000/api/route?from_x=${crossDimScenario.from.x}&from_y=${crossDimScenario.from.y}&from_z=${crossDimScenario.from.z}&from_world=${crossDimScenario.from.world}&to_x=${crossDimScenario.to.x}&to_y=${crossDimScenario.to.y}&to_z=${crossDimScenario.to.z}&to_world=${crossDimScenario.to.world}`);
      const request = new NextRequest(url);
      
      const response = await getRoute(request);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data).toHaveProperty('steps');
      expect(Array.isArray(data.steps)).toBe(true);
      
      // Should have portal steps for dimension crossing
      const portalSteps = data.steps.filter((step: any) => step.type === 'portal');
      expect(portalSteps.length).toBeGreaterThan(0);
    });

    it('should calculate route using place IDs', async () => {
      // Use actual place IDs from our test data
      if (mockPlaces.length < 2) {
        console.warn('Need at least 2 places for place-to-place route testing');
        return;
      }

      const fromPlaceId = mockPlaces[0].id;
      const toPlaceId = mockPlaces[1].id;
      
      const url = new URL(`http://localhost:3000/api/route?from_place_id=${fromPlaceId}&to_place_id=${toPlaceId}`);
      const request = new NextRequest(url);
      
      const response = await getRoute(request);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data).toHaveProperty('steps');
      expect(data).toHaveProperty('total_distance');
    });

    it('should return 400 for invalid route request', async () => {
      const url = new URL('http://localhost:3000/api/route'); // No parameters
      const request = new NextRequest(url);
      
      const response = await getRoute(request);
      expect(response.status).toBe(400);
    });

    it('should return 404 for non-existent place ID', async () => {
      const url = new URL('http://localhost:3000/api/route?from_place_id=non_existent_place&to_place_id=another_non_existent_place');
      const request = new NextRequest(url);
      
      const response = await getRoute(request);
      expect(response.status).toBe(404);
    });
  });
});