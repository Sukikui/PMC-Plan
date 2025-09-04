import { 
  Portal, 
  NetherData,
  loadPlaces, 
  loadPortals, 
  loadNetherData, 
  calculateEuclideanDistance, 
  convertOverworldToNether 
} from '../utils/shared';

export interface NetherAddress {
  address: string;
  nearestStop: {
    axis: string;
    level: number | null;
    coordinates: {
      x: number;
      y: number | undefined;
      z: number;
    };
    distance: number;
  };
  direction?: string;
}

export interface NearestStop {
  axisName: string;
  stop: {
    x: number;
    y: number;
    z: number;
    level: number;
  };
  distance: number;
}

export async function callNetherAddress(x: number, y: number | undefined, z: number): Promise<NetherAddress> {
  const netherData = await loadNetherData();
  
  const nearestStop = findNearestStop(x, z, netherData);
  const spawnDistance = calculateEuclideanDistance(x, y, z, netherData.spawn.x, netherData.spawn.y, netherData.spawn.z);
  
  if (spawnDistance < nearestStop.distance) {
    return {
      address: "Spawn",
      nearestStop: {
        axis: "Spawn",
        level: null,
        coordinates: { x: netherData.spawn.x, y: netherData.spawn.y, z: netherData.spawn.z },
        distance: spawnDistance
      }
    };
  }
  
  const distance = calculateEuclideanDistance(x, y, z, nearestStop.stop.x, nearestStop.stop.y, nearestStop.stop.z);
  
  if (distance <= 10) {
    return {
      address: `${nearestStop.axisName} ${nearestStop.stop.level}`,
      nearestStop: {
        axis: nearestStop.axisName,
        level: nearestStop.stop.level,
        coordinates: nearestStop.stop,
        distance
      }
    };
  }
  
  const direction = x > nearestStop.stop.x ? "droite" : "gauche";
  
  return {
    address: `${nearestStop.axisName} ${nearestStop.stop.level} ${direction}`,
    nearestStop: {
      axis: nearestStop.axisName,
      level: nearestStop.stop.level,
      coordinates: nearestStop.stop,
      distance
    },
    direction
  };
}

export function findNearestStop(x: number, z: number, data: NetherData): NearestStop {
  let nearestStop: NearestStop | null = null;
  
  Object.entries(data.axes).forEach(([axisName, stops]) => {
    stops.forEach(stop => {
      const distance = calculateEuclideanDistance(x, undefined, z, stop.x, stop.y, stop.z);
      if (!nearestStop || distance < nearestStop.distance) {
        nearestStop = {
          axisName,
          stop,
          distance
        };
      }
    });
  });
  
  return nearestStop!;
}

export async function callNearestPortals(x: number, y: number | undefined, z: number, world: string, maxDistance?: number): Promise<(Portal & {distance: number})[]> {
  const allPortals = await loadPortals();
  const worldPortals = allPortals.filter(portal => portal.world === world);
  
  const portalsWithDistance = worldPortals
    .map(portal => ({
      ...portal,
      distance: calculateEuclideanDistance(
        x, y, z,
        portal.coordinates.x, portal.coordinates.y, portal.coordinates.z
      )
    }))
    .sort((a, b) => a.distance - b.distance);
  
  return maxDistance 
    ? portalsWithDistance.filter(portal => portal.distance <= maxDistance)
    : portalsWithDistance;
}

export async function callLinkedPortal(x: number, y: number | undefined, z: number, fromWorld: string): Promise<(Portal & {distance: number}) | null> {
  const allPortals = await loadPortals();
  const targetWorld = fromWorld === 'overworld' ? 'nether' : 'overworld';
  const searchCoords = fromWorld === 'overworld' 
    ? convertOverworldToNether(x, z)
    : { x: x * 8, z: z * 8 };
  
  const searchRadius = targetWorld === 'overworld' ? 128 : 16;
  const targetWorldPortals = allPortals.filter(portal => portal.world === targetWorld);
  
  const candidatePortals = targetWorldPortals
    .filter(portal => {
      const deltaX = Math.abs(portal.coordinates.x - searchCoords.x);
      const deltaZ = Math.abs(portal.coordinates.z - searchCoords.z);
      return deltaX <= searchRadius && deltaZ <= searchRadius;
    })
    .map(portal => ({
      ...portal,
      distance: calculateEuclideanDistance(
        searchCoords.x, fromWorld === 'overworld' ? undefined : y, searchCoords.z,
        portal.coordinates.x, portal.coordinates.y, portal.coordinates.z
      )
    }))
    .sort((a, b) => a.distance - b.distance);
  
  return candidatePortals.length > 0 ? candidatePortals[0] : null;
}

export function calculateNetherNetworkDistance(address1: NetherAddress, address2: NetherAddress): number {
  // Simplified implementation - in reality this would calculate the actual network distance
  // based on the nether axes system described in DECISION.md
  
  // For now, return euclidean distance as approximation
  return calculateEuclideanDistance(
    address1.nearestStop.coordinates.x, address1.nearestStop.coordinates.y, address1.nearestStop.coordinates.z,
    address2.nearestStop.coordinates.x, address2.nearestStop.coordinates.y, address2.nearestStop.coordinates.z
  );
}