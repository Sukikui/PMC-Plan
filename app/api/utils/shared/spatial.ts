import type { Portal, PortalWithDistance } from './types';

export function calculateEuclideanDistance(
  x1: number, y1: number, z1: number,
  x2: number, y2: number, z2: number
): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dz = z2 - z1;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

export function convertOverworldToNether(x: number, z: number): { x: number; z: number } {
  return {
    x: Math.floor(x / 8),
    z: Math.floor(z / 8),
  };
}

export function convertNetherToOverworld(x: number, z: number): { x: number; z: number } {
  return {
    x: x * 8,
    z: z * 8,
  };
}

export async function findNearestPortals(
  x: number,
  y: number,
  z: number,
  world: 'overworld' | 'nether' = 'overworld',
  allPortals: Portal[],
  maxDistance?: number
): Promise<PortalWithDistance[]> {
  const portalsWithDistance = allPortals
    .filter((portal) => portal.world === world)
    .map((portal) => ({
      ...portal,
      distance: calculateEuclideanDistance(
        x, y, z,
        portal.coordinates.x, portal.coordinates.y, portal.coordinates.z
      ),
    }))
    .sort((a, b) => a.distance - b.distance);

  return maxDistance
    ? portalsWithDistance.filter((portal) => portal.distance <= maxDistance)
    : portalsWithDistance;
}
