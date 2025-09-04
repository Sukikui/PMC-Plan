import { 
  Portal, 
  calculateEuclideanDistance,
  convertOverworldToNether, 
  NetherAddress // Import NetherAddress from shared.ts
} from '../utils/shared';
import { RoutePoint } from './route-types';
import { NextResponse } from 'next/server';
import { Place } from '../utils/shared';

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

export async function callNearestPortals(x: number, y: number, z: number, world: string, allPortals: Portal[], maxDistance?: number): Promise<(Portal & {distance: number})[]> {
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

export async function callLinkedPortal(x: number, y: number, z: number, fromWorld: string, allPortals: Portal[]): Promise<(Portal & {distance: number}) | null> {
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
        searchCoords.x, y, searchCoords.z,
        portal.coordinates.x, portal.coordinates.y, portal.coordinates.z
      )
    }))
    .sort((a, b) => a.distance - b.distance);
  
  return candidatePortals.length > 0 ? candidatePortals[0] : null;
}

export function calculateNetherNetworkDistance(address1: NetherAddress, address2: NetherAddress): number {
  // Simplified implementation - in reality this would calculate the actual network distance
  // based on the nether axes system described in DECISION.md
  
  // Check if both addresses have nearestStop data
  if (!address1.nearestStop || !address2.nearestStop) {
    throw new Error('Both addresses must have nearestStop data to calculate nether network distance');
  }
  
  // For now, return euclidean distance as approximation
  return calculateEuclideanDistance(
    address1.nearestStop.coordinates.x, address1.nearestStop.coordinates.y, address1.nearestStop.coordinates.z,
    address2.nearestStop.coordinates.x, address2.nearestStop.coordinates.y, address2.nearestStop.coordinates.z
  );
}

export function resolveRoutePoint(
  isPlace: boolean,
  placeId: string | undefined | null,
  x: number | undefined,
  y: number | undefined,
  z: number | undefined,
  world: string | undefined | null,
  places: Place[],
  portals: Portal[],
  pointType: 'from' | 'to'
): RoutePoint | NextResponse {
  if (isPlace) {
    let foundPlace: Place | Portal | undefined = places.find(p => p.id === placeId);
    if (!foundPlace) {
      foundPlace = portals.find(p => p.id === placeId);
    }
    if (!foundPlace) {
      return NextResponse.json(
        { error: `Place or portal with id '${placeId}' not found for ${pointType} point` },
        { status: 404 }
      );
    }
    return {
      coordinates: foundPlace.coordinates,
      world: foundPlace.world,
      name: foundPlace.name,
      id: foundPlace.id
    };
  } else {
    return {
      coordinates: {
        x: x!,
        y: y!,
        z: z!
      },
      world: world || 'overworld'
    };
  }
}
