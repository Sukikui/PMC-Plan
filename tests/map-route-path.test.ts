import {
  buildMapRoutePath,
  getSelectedMapRoute,
} from '../lib/map/route-path';
import type { RouteData } from '../lib/route-planning';

describe('map route path', () => {
  it('uses the normalized direct-route origin location', () => {
    const route = createRoute([
      {
        type: 'overworld_transport',
        distance: 10,
        from: {
          name: 'Position de départ',
          coordinates: { x: 5, y: 70, z: 8 },
        },
        to: {
          id: 'spawn',
          name: 'Spawn',
          coordinates: { x: 15, y: 70, z: 18 },
        },
      },
    ]);

    expect(buildMapRoutePath(route)?.segments).toEqual([
      {
        id: 'route-segment-0',
        world: 'overworld',
        points: [{ x: 5, z: 8 }, { x: 15, z: 18 }],
        sequence: 0,
        source: {
          label: 'Position du joueur',
        },
        target: {
          id: 'spawn',
          label: 'Spawn',
          kind: 'destination',
        },
      },
    ]);
  });

  it('separates cross-world segments and marks both portal endpoints', () => {
    const route = createRoute([
      transportStep('overworld_transport', 'ow-portal', { x: 80, y: 70, z: 160 }),
      {
        type: 'portal',
        from: { id: 'ow-portal', coordinates: { x: 80, y: 70, z: 160 } },
        to: { id: 'nether-portal', coordinates: { x: 10, y: 70, z: 20 } },
      },
      transportStep('nether_transport', 'destination', { x: 50, y: 70, z: 60 }, {
        id: 'nether-portal',
        coordinates: { x: 10, y: 70, z: 20 },
      }),
    ]);

    const path = buildMapRoutePath(route);

    expect(getSelectedMapRoute(path, 'route-segment-0', 'overworld').markers.map((marker) => marker.kind))
      .toEqual(['start', 'transition']);
    expect(getSelectedMapRoute(path, 'route-segment-2', 'nether').markers.map((marker) => marker.kind))
      .toEqual(['transition', 'destination']);
    expect(path?.segments.map((segment) => segment.target.kind))
      .toEqual(['portal', 'destination']);
  });

  it('keeps the animation identity stable when only the player origin moves', () => {
    const first = createRoute([
      transportStep('overworld_transport', 'spawn', { x: 50, y: 70, z: 50 }),
    ]);
    const moved = {
      ...first,
      player_from: {
        ...first.player_from,
        coordinates: { x: 12, y: 70, z: 8 },
      },
    };

    expect(buildMapRoutePath(moved)?.key).toBe(buildMapRoutePath(first)?.key);
  });

  it('uses the detailed Nether geometry when the API provides it', () => {
    const step = transportStep(
      'nether_transport',
      'destination',
      { x: 100, y: 70, z: 100 },
      { coordinates: { x: 0, y: 70, z: 0 } }
    );
    step.path = [
      { x: 0, y: 70, z: 0 },
      { x: 0, y: 70, z: 50 },
      { x: 100, y: 70, z: 50 },
      { x: 100, y: 70, z: 100 },
    ];

    expect(buildMapRoutePath(createRoute([step]))?.segments[0].points).toEqual([
      { x: 0, z: 0 },
      { x: 0, z: 50 },
      { x: 100, z: 50 },
      { x: 100, z: 100 },
    ]);
  });
});

const createRoute = (steps: RouteData['steps']): RouteData => ({
  player_from: {
    coordinates: { x: 0, y: 70, z: 0 },
    world: 'overworld',
  },
  total_distance: 10,
  steps,
});

const transportStep = (
  type: 'overworld_transport' | 'nether_transport',
  id: string,
  coordinates: { x: number; y: number; z: number },
  from = {}
): RouteData['steps'][number] => ({
  type,
  distance: 10,
  from,
  to: { id, name: id, coordinates },
});
