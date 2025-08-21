const { describe, test, expect, beforeAll, afterAll } = require('@jest/globals');

// Base URL for API tests
const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

describe('PMC Map API Tests', () => {
  
  describe('GET /api/nether-address', () => {
    test('should return Nord-2-gauche address', async () => {
      const response = await fetch(`${BASE_URL}/api/nether-address?x=-35&z=-31`);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.address).toMatch(/Nord 2 gauche/);
      expect(data.nearestStop.axis).toBe('Nord');
      expect(data.nearestStop.level).toBe(2);
    });

    test('should return Est-7-droite address', async () => {
      const response = await fetch(`${BASE_URL}/api/nether-address?x=580&z=45`);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.address).toMatch(/Est 7 droite/);
      expect(data.nearestStop.axis).toBe('Est');
      expect(data.nearestStop.level).toBe(7);
    });

    test('should return Spawn when closest to spawn', async () => {
      const response = await fetch(`${BASE_URL}/api/nether-address?x=-20&z=29`);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.address).toBe('Spawn');
      expect(data.nearestStop.axis).toBe('Spawn');
    });

    test('should handle missing parameters', async () => {
      const response = await fetch(`${BASE_URL}/api/nether-address?x=100`);
      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/nearest-portals', () => {
    test('should find portals near start village', async () => {
      const response = await fetch(`${BASE_URL}/api/nearest-portals?x=-100&z=-200&world=overworld`);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);
      expect(data[0]).toHaveProperty('id');
      expect(data[0]).toHaveProperty('distance');
      expect(data[0].world).toBe('overworld');
      
      // Should be sorted by distance
      for (let i = 1; i < data.length; i++) {
        expect(data[i].distance).toBeGreaterThanOrEqual(data[i-1].distance);
      }
    });

    test('should find portals near end city', async () => {
      const response = await fetch(`${BASE_URL}/api/nearest-portals?x=4500&z=300&world=overworld`);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);
    });

    test('should filter by max_distance', async () => {
      const response = await fetch(`${BASE_URL}/api/nearest-portals?x=-100&z=-200&world=overworld&max_distance=50`);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      data.forEach(portal => {
        expect(portal.distance).toBeLessThanOrEqual(50);
      });
    });

    test('should find nether portals', async () => {
      const response = await fetch(`${BASE_URL}/api/nearest-portals?x=-35&z=-31&world=nether`);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      data.forEach(portal => {
        expect(portal.world).toBe('nether');
      });
    });
  });

  describe('GET /api/linked-portal', () => {
    test('should find linked nether portal from village portal', async () => {
      const response = await fetch(`${BASE_URL}/api/linked-portal?x=-120&y=65&z=-220&from_world=overworld`);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      if (data) {
        expect(data.world).toBe('nether');
        expect(data).toHaveProperty('distance');
        expect(data.id).toBe('portal_village_start_nether');
      }
    });

    test('should find linked overworld portal from nether', async () => {
      const response = await fetch(`${BASE_URL}/api/linked-portal?x=-35&y=70&z=-31&from_world=nether`);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      if (data) {
        expect(data.world).toBe('overworld');
        expect(data).toHaveProperty('distance');
      }
    });

    test('should return null when no linked portal exists', async () => {
      const response = await fetch(`${BASE_URL}/api/linked-portal?x=9999&y=70&z=9999&from_world=overworld`);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data).toBeNull();
    });
  });

  describe('GET /api/route', () => {
    test('should calculate route from start village to end city via nether', async () => {
      const response = await fetch(`${BASE_URL}/api/route?from_place_id=start_village&to_place_id=end_city`);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data).toHaveProperty('player_from');
      expect(data).toHaveProperty('total_distance');
      expect(data).toHaveProperty('steps');
      expect(Array.isArray(data.steps)).toBe(true);
      
      // Should have multiple steps for nether route
      expect(data.steps.length).toBeGreaterThan(1);
      
      // Check step types
      const stepTypes = data.steps.map(step => step.type);
      expect(stepTypes).toContain('overworld_transport');
      expect(stepTypes).toContain('portal');
      expect(stepTypes).toContain('nether_transport');
    });

    test('should calculate route using coordinates', async () => {
      const response = await fetch(`${BASE_URL}/api/route?from_x=-100&from_z=-200&from_world=overworld&to_x=4500&to_z=300&to_world=overworld`);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data).toHaveProperty('total_distance');
      expect(data.total_distance).toBeGreaterThan(0);
    });

    test('should calculate nether to nether route', async () => {
      const response = await fetch(`${BASE_URL}/api/route?from_x=-35&from_z=-31&from_world=nether&to_x=580&to_z=45&to_world=nether`);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.steps.length).toBe(1);
      expect(data.steps[0].type).toBe('nether_transport');
      expect(data.steps[0].from).toHaveProperty('address');
      expect(data.steps[0].to).toHaveProperty('address');
    });

    test('should calculate overworld to nether route', async () => {
      const response = await fetch(`${BASE_URL}/api/route?from_x=-100&from_z=-200&from_world=overworld&to_x=580&to_z=45&to_world=nether`);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.steps.length).toBe(3);
      expect(data.steps[0].type).toBe('overworld_transport');
      expect(data.steps[1].type).toBe('portal');
      expect(data.steps[2].type).toBe('nether_transport');
    });

    test('should handle invalid place IDs', async () => {
      const response = await fetch(`${BASE_URL}/api/route?from_place_id=nonexistent&to_place_id=end_city`);
      expect(response.status).toBe(404);
    });

    test('should handle missing parameters', async () => {
      const response = await fetch(`${BASE_URL}/api/route?from_x=100`);
      expect(response.status).toBe(400);
    });
  });

  describe('Integration Tests', () => {
    test('should complete full journey workflow', async () => {
      // 1. Get nether address for starting nether portal
      const netherResponse1 = await fetch(`${BASE_URL}/api/nether-address?x=-35&z=-31`);
      const netherData1 = await netherResponse1.json();
      expect(netherData1.address).toMatch(/Nord 2 gauche/);

      // 2. Get nether address for ending nether portal  
      const netherResponse2 = await fetch(`${BASE_URL}/api/nether-address?x=580&z=45`);
      const netherData2 = await netherResponse2.json();
      expect(netherData2.address).toMatch(/Est 7 droite/);

      // 3. Find nearest portals from start
      const portalsResponse = await fetch(`${BASE_URL}/api/nearest-portals?x=-100&z=-200&world=overworld`);
      const portalsData = await portalsResponse.json();
      expect(portalsData.length).toBeGreaterThan(0);

      // 4. Check portal linking
      const linkedResponse = await fetch(`${BASE_URL}/api/linked-portal?x=${portalsData[0].coordinates.x}&y=${portalsData[0].coordinates.y}&z=${portalsData[0].coordinates.z}&from_world=overworld`);
      const linkedData = await linkedResponse.json();
      
      // 5. Calculate complete route
      const routeResponse = await fetch(`${BASE_URL}/api/route?from_place_id=start_village&to_place_id=end_city`);
      const routeData = await routeResponse.json();
      expect(routeData.total_distance).toBeGreaterThan(0);
      
      // Verify the route goes through nether
      const hasNetherTransport = routeData.steps.some(step => step.type === 'nether_transport');
      expect(hasNetherTransport).toBe(true);
    });
  });
});