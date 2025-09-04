import { GET as getRoute } from '../app/api/route/route';
import { NextRequest } from 'next/server';
import { mockPlaces, mockPortals } from './mockData';

// Mock the loadPlaces and loadPortals functions
jest.mock('../app/api/utils/shared', () => ({
  ...jest.requireActual('../app/api/utils/shared'),
  loadPlaces: jest.fn(() => Promise.resolve(mockPlaces)),
  loadPortals: jest.fn(() => Promise.resolve(mockPortals))
}));

describe('Route API Integration Tests - Real Behavior Validation', () => {
  
  describe('Overworld to Overworld Routes', () => {
    it('should use direct route for short distances', async () => {
      const url = new URL('http://localhost:3000/api/route?from_x=100&from_y=70&from_z=100&from_world=overworld&to_x=200&to_y=70&to_z=200&to_world=overworld');
      const request = new NextRequest(url);
      
      const response = await getRoute(request);
      const route = await response.json();
      
      expect(response.status).toBe(200);
      expect(route.total_distance).toBeCloseTo(141.42, 2);
      expect(route.steps).toHaveLength(1);
      expect(route.steps[0].type).toBe('overworld_transport');
      expect(route.steps[0].to.name).toBe('Destination');
    });

    it('should use nether optimization: spawn_overworld → portail_spawn(overworld) → portail_spawn(nether@Spawn) → portail_village_suki(Est 7 droite) → portail_village_suki(overworld) → village_suki', async () => {
      const url = new URL('http://localhost:3000/api/route?from_place_id=spawn_overworld&to_place_id=village_suki');
      const request = new NextRequest(url);
      
      const response = await getRoute(request);
      const route = await response.json();
      
      expect(response.status).toBe(200);
      expect(route.steps).toHaveLength(5);
      
      // Step 1: Overworld transport to portal
      expect(route.steps[0].type).toBe('overworld_transport');
      expect(route.steps[0].to.id).toBe('portail_spawn');
      
      // Step 2: Portal crossing overworld → nether
      expect(route.steps[1].type).toBe('portal');
      expect(route.steps[1].from.id).toBe('portail_spawn');
      expect(route.steps[1].from.world).toBe('overworld');
      expect(route.steps[1].to.id).toBe('portail_spawn');
      expect(route.steps[1].to.world).toBe('nether');
      expect(route.steps[1].to.address).toBe('Spawn');
      
      // Step 3: Nether transport between portals
      expect(route.steps[2].type).toBe('nether_transport');
      expect(route.steps[2].from.address).toBe('Spawn');
      expect(route.steps[2].to.id).toBe('portail_village_suki');
      expect(route.steps[2].to.address).toBe('Est 7 droite');
      expect(route.steps[2].distance).toBe(600);
      
      // Step 4: Portal crossing nether → overworld
      expect(route.steps[3].type).toBe('portal');
      expect(route.steps[3].from.world).toBe('nether');
      expect(route.steps[3].to.world).toBe('overworld');
      
      // Step 5: Final overworld transport to destination
      expect(route.steps[4].type).toBe('overworld_transport');
      expect(route.steps[4].to.id).toBe('village_suki');
      expect(route.steps[4].to.name).toBe('Village de Suki');
    });
  });

  describe('Nether to Nether Routes', () => {
    it('should use nether transport: Position de départ(Sud-Est 3) → Destination(Sud-Est 4)', async () => {
      const url = new URL('http://localhost:3000/api/route?from_x=100&from_y=70&from_z=100&from_world=nether&to_x=200&to_y=70&to_z=200&to_world=nether');
      const request = new NextRequest(url);
      
      const response = await getRoute(request);
      const route = await response.json();
      
      expect(response.status).toBe(200);
      expect(route.steps).toHaveLength(1);
      expect(route.steps[0].type).toBe('nether_transport');
      expect(route.steps[0].from.address).toBe('Sud-Est 3');
      expect(route.steps[0].to.address).toBe('Sud-Est 4');
      expect(route.steps[0].from.name).toBe('Position de départ');
      expect(route.steps[0].to.name).toBe('Destination');
    });
  });

  describe('Overworld to Nether Routes', () => {
    it('should route overworld→nether: spawn_overworld → portail_spawn(overworld) → portail_spawn(nether@Spawn) → base_nether(Sud-Est 5)', async () => {
      const url = new URL('http://localhost:3000/api/route?from_place_id=spawn_overworld&to_place_id=base_nether');
      const request = new NextRequest(url);
      
      const response = await getRoute(request);
      const route = await response.json();
      
      expect(response.status).toBe(200);
      expect(route.steps).toHaveLength(3);
      
      // Step 1: Overworld transport to nearest portal
      expect(route.steps[0].type).toBe('overworld_transport');
      expect(route.steps[0].from).toEqual({x: 0, y: 70, z: 0});
      expect(route.steps[0].to.id).toBe('portail_spawn');
      
      // Step 2: Portal crossing
      expect(route.steps[1].type).toBe('portal');
      expect(route.steps[1].from.id).toBe('portail_spawn');
      expect(route.steps[1].to.id).toBe('portail_spawn');
      expect(route.steps[1].to.address).toBe('Spawn');
      
      // Step 3: Nether transport to destination
      expect(route.steps[2].type).toBe('nether_transport');
      expect(route.steps[2].from.address).toBe('Spawn');
      expect(route.steps[2].to.id).toBe('base_nether');
      expect(route.steps[2].to.name).toBe('Base Nether');
      expect(route.steps[2].to.address).toBe('Sud-Est 5');
    });
  });

  describe('Nether to Overworld Routes', () => {
    it('should route nether→overworld: Position de départ(Sud-Est 3) → portail_spawn(nether@Spawn) → portail_spawn(overworld) → Destination(2000,70,2000)', async () => {
      const url = new URL('http://localhost:3000/api/route?from_x=100&from_y=70&from_z=100&from_world=nether&to_x=2000&to_y=70&to_z=2000&to_world=overworld');
      const request = new NextRequest(url);
      
      const response = await getRoute(request);
      const route = await response.json();
      
      expect(response.status).toBe(200);
      expect(route.steps).toHaveLength(3);
      
      // Step 1: Nether transport to portal
      expect(route.steps[0].type).toBe('nether_transport');
      expect(route.steps[0].from.name).toBe('Position de départ');
      expect(route.steps[0].from.address).toBe('Sud-Est 3');
      expect(route.steps[0].to.id).toBe('portail_spawn');
      expect(route.steps[0].to.address).toBe('Spawn');
      
      // Step 2: Portal crossing
      expect(route.steps[1].type).toBe('portal');
      expect(route.steps[1].from.id).toBe('portail_spawn');
      expect(route.steps[1].to.id).toBe('portail_spawn');
      
      // Step 3: Overworld transport to final destination
      expect(route.steps[2].type).toBe('overworld_transport');
      expect(route.steps[2].to.name).toBe('Destination');
      expect(route.steps[2].to.coordinates).toEqual({x: 2000, y: 70, z: 2000});
    });
  });

  describe('Response Structure Validation', () => {
    it('should provide complete player_from information', async () => {
      const url = new URL('http://localhost:3000/api/route?from_x=100&from_y=70&from_z=100&from_world=overworld&to_x=200&to_y=70&to_z=200&to_world=overworld');
      const request = new NextRequest(url);
      
      const response = await getRoute(request);
      const route = await response.json();
      
      expect(response.status).toBe(200);
      expect(route).toHaveProperty('player_from');
      expect(route.player_from).toEqual({
        coordinates: {x: 100, y: 70, z: 100},
        world: 'overworld'
      });
      expect(route).toHaveProperty('total_distance');
      expect(typeof route.total_distance).toBe('number');
    });

    it('should include nether addresses in all nether steps', async () => {
      const url = new URL('http://localhost:3000/api/route?from_place_id=spawn_overworld&to_place_id=base_nether');
      const request = new NextRequest(url);
      
      const response = await getRoute(request);
      const route = await response.json();
      
      expect(response.status).toBe(200);
      
      // All nether positions should have addresses
      route.steps.forEach((step: any) => {
        if (step.from?.world === 'nether' || step.to?.world === 'nether') {
          if (step.from?.world === 'nether') {
            expect(step.from).toHaveProperty('address');
            expect(typeof step.from.address).toBe('string');
          }
          if (step.to?.world === 'nether') {
            expect(step.to).toHaveProperty('address');
            expect(typeof step.to.address).toBe('string');
          }
        }
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle same location routes correctly', async () => {
      const url = new URL('http://localhost:3000/api/route?from_x=100&from_y=70&from_z=100&from_world=overworld&to_x=100&to_y=70&to_z=100&to_world=overworld');
      const request = new NextRequest(url);
      
      const response = await getRoute(request);
      const route = await response.json();
      
      expect(response.status).toBe(200);
      expect(route.total_distance).toBe(0);
      expect(route.steps).toHaveLength(1);
      expect(route.steps[0].type).toBe('overworld_transport');
      expect(route.steps[0].distance).toBe(0);
    });

    it('should return 400 for missing required parameters', async () => {
      const url = new URL('http://localhost:3000/api/route');
      const request = new NextRequest(url);
      
      const response = await getRoute(request);
      expect(response.status).toBe(400);
    });

    it('should return 404 for non-existent place IDs', async () => {
      const url = new URL('http://localhost:3000/api/route?from_place_id=inexistant_place&to_place_id=autre_inexistant');
      const request = new NextRequest(url);
      
      const response = await getRoute(request);
      expect(response.status).toBe(404);
    });

    it('should handle mixed coordinate and place ID inputs', async () => {
      const url = new URL('http://localhost:3000/api/route?from_x=0&from_y=70&from_z=0&from_world=overworld&to_place_id=village_suki');
      const request = new NextRequest(url);
      
      const response = await getRoute(request);
      const route = await response.json();
      
      expect(response.status).toBe(200);
      expect(route.steps).toBeDefined();
      expect(route.steps[route.steps.length - 1].to.id).toBe('village_suki');
    });

  });

  describe('Distance and Step Validation', () => {
    it('should calculate accurate total distances', async () => {
      const url = new URL('http://localhost:3000/api/route?from_place_id=spawn_overworld&to_place_id=village_suki');
      const request = new NextRequest(url);
      
      const response = await getRoute(request);
      const route = await response.json();
      
      expect(response.status).toBe(200);
      
      // Sum of individual step distances should approximately equal total
      const stepsWithDistance = route.steps.filter((step: any) => step.distance !== undefined);
      const stepDistanceSum = stepsWithDistance.reduce((sum: number, step: any) => sum + step.distance, 0);
      
      if (stepsWithDistance.length > 0) {
        expect(Math.abs(stepDistanceSum - route.total_distance)).toBeLessThan(1);
      }
    });

    it('should provide step descriptions and required properties', async () => {
      const url = new URL('http://localhost:3000/api/route?from_place_id=spawn_overworld&to_place_id=base_nether');
      const request = new NextRequest(url);
      
      const response = await getRoute(request);
      const route = await response.json();
      
      expect(response.status).toBe(200);
      
      route.steps.forEach((step: any) => {
        expect(step).toHaveProperty('type');
        expect(['overworld_transport', 'nether_transport', 'portal'].includes(step.type)).toBe(true);
        
        if (step.type === 'portal') {
          expect(step).toHaveProperty('from');
          expect(step).toHaveProperty('to');
          expect(step.from).toHaveProperty('id');
          expect(step.to).toHaveProperty('id');
        }
        
        if (step.type === 'overworld_transport' || step.type === 'nether_transport') {
          expect(step).toHaveProperty('distance');
          expect(step).toHaveProperty('from');
          expect(step).toHaveProperty('to');
          expect(typeof step.distance).toBe('number');
        }
      });
    });
  });
});