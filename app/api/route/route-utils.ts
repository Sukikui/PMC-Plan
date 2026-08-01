import {
  calculateEuclideanDistance,
  convertOverworldToNether,
  resolveNetherAddressForWorld
} from '../utils/shared';
import type {
  RouteEntity,
  RoutePoint,
  RoutePortal,
  RoutePortalWithDistance,
} from './route-types';
import { NextResponse } from 'next/server';

export function callNearestPortal(
  x: number,
  y: number,
  z: number,
  world: string,
  allPortals: RoutePortal[],
  maxDistance?: number,
): RoutePortalWithDistance | null {
  let nearest: RoutePortalWithDistance | null = null;

  allPortals.forEach((portal) => {
    if (portal.world !== world) return;
    const distance = calculateEuclideanDistance(
      x, y, z,
      portal.coordinates.x, portal.coordinates.y, portal.coordinates.z,
    );
    if (maxDistance !== undefined && distance > maxDistance) return;
    if (!nearest || distance < nearest.distance) nearest = { ...portal, distance };
  });

  return nearest;
}

export function callLinkedPortal<T extends RoutePortal>(
  x: number,
  y: number,
  z: number,
  fromWorld: string,
  allPortals: T[],
): (T & { distance: number }) | null {
  const targetWorld = fromWorld === 'overworld' ? 'nether' : 'overworld';
  const searchCoords = fromWorld === 'overworld' 
    ? convertOverworldToNether(x, z)
    : { x: x * 8, z: z * 8 };
  
  const searchRadius = targetWorld === 'overworld' ? 128 : 16;
  let nearest: (T & { distance: number }) | null = null;

  allPortals.forEach((portal) => {
    if (portal.world !== targetWorld) return;
    const deltaX = Math.abs(portal.coordinates.x - searchCoords.x);
    const deltaZ = Math.abs(portal.coordinates.z - searchCoords.z);
    if (deltaX > searchRadius || deltaZ > searchRadius) return;

    const distance = calculateEuclideanDistance(
      searchCoords.x, y, searchCoords.z,
      portal.coordinates.x, portal.coordinates.y, portal.coordinates.z,
    );
    if (!nearest || distance < nearest.distance) nearest = { ...portal, distance };
  });

  return nearest;
}

export async function resolveRoutePoint(
  isPlace: boolean,
  placeId: string | undefined | null,
  x: number | undefined,
  y: number | undefined,
  z: number | undefined,
  world: string | undefined | null,
  places: RouteEntity[],
  portals: RoutePortal[],
  pointType: 'from' | 'to'
): Promise<RoutePoint | NextResponse> {
  if (isPlace) {
    let foundPlace: RouteEntity | undefined = places.find(p => p.id === placeId);
    if (!foundPlace) {
      foundPlace = portals.find(p => p.id === placeId);
    }
    if (!foundPlace) {
      return NextResponse.json(
        { error: `Place or portal with id '${placeId}' not found for ${pointType} point` },
        { status: 404 }
      );
    }

    const address = await resolveNetherAddressForWorld(
      foundPlace.world,
      foundPlace.coordinates,
      foundPlace.address
    );

    return {
      coordinates: foundPlace.coordinates,
      world: foundPlace.world,
      name: foundPlace.name,
      id: foundPlace.id,
      address: address ?? undefined
    };
  } else {
    const coordinates = {
      x: x!,
      y: y!,
      z: z!
    };
    const resolvedWorld = world || 'overworld';
    const address = await resolveNetherAddressForWorld(resolvedWorld, coordinates);

    return {
      coordinates,
      world: resolvedWorld,
      address: address ?? undefined
    };
  }
}
