import { buildRouteBreadcrumb, type RouteData } from '../lib/route-planning';

describe('buildRouteBreadcrumb', () => {
  it('adds the nether address to an overworld portal waypoint before a portal crossing', () => {
    const route: RouteData = {
      player_from: {
        coordinates: { x: 0, y: 70, z: 0 },
        world: 'overworld',
      },
      total_distance: 42,
      steps: [
        {
          type: 'overworld_transport',
          distance: 12,
          from: {},
          to: {
            id: 'portail_spawn_overworld',
            name: 'Portail du Spawn',
            coordinates: { x: -166, y: 74, z: 254 },
            world: 'overworld',
          },
        },
        {
          type: 'portal',
          from: {
            id: 'portail_spawn_overworld',
            name: 'Portail du Spawn',
            coordinates: { x: -166, y: 74, z: 254 },
            world: 'overworld',
          },
          to: {
            id: 'portail_spawn_nether',
            name: 'Portail du Spawn',
            coordinates: { x: -19, y: 69, z: 29 },
            world: 'nether',
            address: 'Spawn',
          },
        },
        {
          type: 'nether_transport',
          distance: 30,
          from: {
            id: 'portail_spawn_nether',
            name: 'Portail du Spawn',
            coordinates: { x: -19, y: 69, z: 29 },
            world: 'nether',
            address: 'Spawn',
          },
          to: {
            id: 'portail_arene_nether',
            name: "Portail de l'arène",
            coordinates: { x: 16, y: 74, z: -327 },
            world: 'nether',
            address: 'Nord 5 droite',
          },
        },
      ],
    };

    const [, spawnPortal, arenaPortal] = buildRouteBreadcrumb(route);

    expect(spawnPortal.address).toBe('Spawn');
    expect(spawnPortal.coordinateItems).toEqual([
      {
        world: 'overworld',
        coordinates: { x: -166, y: 74, z: 254 },
      },
      {
        world: 'nether',
        coordinates: { x: -19, y: 69, z: 29 },
      },
    ]);
    expect(arenaPortal.address).toBe('Nord 5 droite');
    expect(arenaPortal.coordinateItems).toEqual([
      {
        world: 'nether',
        coordinates: { x: 16, y: 74, z: -327 },
      },
    ]);
  });

  it('resolves both portal coordinates from the coordinate pair when portal IDs are missing', () => {
    const route: RouteData = {
      player_from: {
        coordinates: { x: 0, y: 70, z: 0 },
        world: 'nether',
      },
      total_distance: 30,
      steps: [
        {
          type: 'nether_transport',
          distance: 20,
          from: {},
          to: {
            coordinates: { x: -19, y: 69, z: 29 },
            address: 'Spawn',
          },
        },
        {
          type: 'portal',
          from: {
            coordinates: { x: -19, y: 69, z: 29 },
            address: 'Spawn',
          },
          to: {
            id: 'portail_spawn',
            name: 'Portail du Spawn',
            coordinates: { x: -166, y: 74, z: 254 },
          },
        },
        {
          type: 'overworld_transport',
          distance: 10,
          from: {
            id: 'portail_spawn',
            name: 'Portail du Spawn',
            coordinates: { x: -166, y: 74, z: 254 },
          },
          to: {
            id: 'spawn',
            name: 'Spawn',
            coordinates: { x: 0, y: 70, z: 0 },
          },
        },
      ],
    };

    const [, spawnPortal] = buildRouteBreadcrumb(route);

    expect(spawnPortal.address).toBe('Spawn');
    expect(spawnPortal.coordinateItems).toEqual([
      {
        world: 'nether',
        coordinates: { x: -19, y: 69, z: 29 },
      },
      {
        world: 'overworld',
        coordinates: { x: -166, y: 74, z: 254 },
      },
    ]);
  });

  it('orders portal coordinates according to the route crossing direction', () => {
    const route: RouteData = {
      player_from: {
        coordinates: { x: 0, y: 70, z: 0 },
        world: 'overworld',
      },
      total_distance: 80,
      steps: [
        {
          type: 'overworld_transport',
          distance: 20,
          from: {},
          to: {
            id: 'portail_spawn_overworld',
            name: 'Portail du Spawn',
            coordinates: { x: -166, y: 74, z: 254 },
            world: 'overworld',
          },
        },
        {
          type: 'portal',
          from: {
            id: 'portail_spawn_overworld',
            name: 'Portail du Spawn',
            coordinates: { x: -166, y: 74, z: 254 },
            world: 'overworld',
          },
          to: {
            id: 'portail_spawn_nether',
            name: 'Portail du Spawn',
            coordinates: { x: -19, y: 69, z: 29 },
            world: 'nether',
            address: 'Spawn',
          },
        },
        {
          type: 'nether_transport',
          distance: 40,
          from: {
            id: 'portail_spawn_nether',
            name: 'Portail du Spawn',
            coordinates: { x: -19, y: 69, z: 29 },
            world: 'nether',
            address: 'Spawn',
          },
          to: {
            id: 'portail_arene_nether',
            name: "Portail de l'arène",
            coordinates: { x: 16, y: 74, z: -327 },
            world: 'nether',
            address: 'Nord 5 droite',
          },
        },
        {
          type: 'portal',
          from: {
            id: 'portail_arene_nether',
            name: "Portail de l'arène",
            coordinates: { x: 16, y: 74, z: -327 },
            world: 'nether',
            address: 'Nord 5 droite',
          },
          to: {
            id: 'portail_arene_overworld',
            name: "Portail de l'arène",
            coordinates: { x: 128, y: 74, z: -2616 },
            world: 'overworld',
          },
        },
        {
          type: 'overworld_transport',
          distance: 20,
          from: {
            id: 'portail_arene_overworld',
            name: "Portail de l'arène",
            coordinates: { x: 128, y: 74, z: -2616 },
            world: 'overworld',
          },
          to: {
            id: 'arene',
            name: 'Arène',
            coordinates: { x: 126, y: 69, z: -2750 },
            world: 'overworld',
          },
        },
      ],
    };

    const [, spawnPortal, arenaPortal] = buildRouteBreadcrumb(route);

    expect(spawnPortal.coordinateItems).toEqual([
      {
        world: 'overworld',
        coordinates: { x: -166, y: 74, z: 254 },
      },
      {
        world: 'nether',
        coordinates: { x: -19, y: 69, z: 29 },
      },
    ]);

    expect(arenaPortal.coordinateItems).toEqual([
      {
        world: 'nether',
        coordinates: { x: 16, y: 74, z: -327 },
      },
      {
        world: 'overworld',
        coordinates: { x: 128, y: 74, z: -2616 },
      },
    ]);
  });
});
