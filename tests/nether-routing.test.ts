import {
  NETHER_AXIS_ORDER,
  netherAxesData,
  netherAxisPolylines,
} from '../lib/nether/network-data';
import { calculateNetherRoute } from '../lib/nether/routing';

describe('Nether axis routing', () => {
  it('builds radial axes and closed level rings from the validated data', () => {
    expect(netherAxisPolylines).toHaveLength(16);
    expect(Object.keys(netherAxesData.axes)).toEqual(expect.arrayContaining(NETHER_AXIS_ORDER));

    const levelTwoRing = netherAxisPolylines.find(({ id }) => id === 'nether-ring-level-2');
    expect(levelTwoRing?.points).toHaveLength(9);
    expect(levelTwoRing?.points[0]).toEqual(levelTwoRing?.points.at(-1));
  });

  it('routes between projections on the same axis segment', () => {
    const from = { x: -20, y: 70, z: -10 };
    const to = { x: -20, y: 70, z: -20 };
    const route = calculateNetherRoute(from, to);

    expect(route.usesAxes).toBe(true);
    expect(route.distance).toBeCloseTo(10);
    expect(route.path).toEqual([from, to]);
  });

  it('uses a level ring between perpendicular radial axes', () => {
    const from = { x: -20, y: 70, z: -30 };
    const to = { x: 39, y: 70, z: 29 };
    const route = calculateNetherRoute(from, to);

    expect(route.usesAxes).toBe(true);
    expect(route.path).toContainEqual({ x: 39, y: 70, z: -30 });
    expect(route.path[0]).toEqual(from);
    expect(route.path.at(-1)).toEqual(to);
  });

  it('reuses an existing stop when an endpoint is already on the network', () => {
    const from = netherAxesData.spawn;
    const to = { x: 100, y: 75, z: 100 };
    const route = calculateNetherRoute(from, to);

    expect(route.usesAxes).toBe(true);
    expect(route.path[0]).toEqual(from);
    expect(route.path.at(-1)).toEqual(to);
    expect(route.path.every((point) => point !== undefined)).toBe(true);
  });

  it('keeps the direct route when it is at least twice as short', () => {
    const from = { x: 1000, y: 70, z: 1000 };
    const to = { x: 1001, y: 70, z: 1000 };
    const route = calculateNetherRoute(from, to);

    expect(route).toEqual({
      distance: 1,
      path: [from, to],
      usesAxes: false,
    });
  });

  it('returns a zero-length direct route for identical points', () => {
    const point = { x: 10, y: 64, z: 20 };
    expect(calculateNetherRoute(point, point)).toEqual({
      distance: 0,
      path: [point, point],
      usesAxes: false,
    });
  });
});
