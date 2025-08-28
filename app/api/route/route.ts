import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { 
  Portal, 
  NetherData,
  loadPlaces, 
  loadPortals, 
  loadNetherData, 
  calculateEuclideanDistance, 
  convertOverworldToNether 
} from '../utils/shared';
import { normalizeWorldName } from '../../../lib/world-utils';

const QuerySchema = z.object({
  from_x: z.coerce.number().optional(),
  from_y: z.coerce.number().optional(),
  from_z: z.coerce.number().optional(),
  from_world: z.enum(['overworld', 'nether']).optional().nullable(),
  from_place_id: z.string().optional().nullable(),
  to_x: z.coerce.number().optional(),
  to_y: z.coerce.number().optional(),
  to_z: z.coerce.number().optional(),
  to_world: z.enum(['overworld', 'nether']).optional().nullable(),
  to_place_id: z.string().optional().nullable(),
});

interface RoutePoint {
  coordinates: {
    x: number;
    y: number;
    z: number;
  };
  world: string;
  name?: string;
  id?: string;
}

interface NetherAddress {
  address: string;
  nearestStop: {
    axis: string;
    level: number | null;
    coordinates: {
      x: number;
      y: number;
      z: number;
    };
    distance: number;
  };
  direction?: string;
}

interface NearestStop {
  axisName: string;
  stop: {
    x: number;
    y: number;
    z: number;
    level: number;
  };
  distance: number;
}

async function callNetherAddress(x: number, y: number, z: number): Promise<NetherAddress> {
  const netherData = await loadNetherData();
  
  const nearestStop = findNearestStop(x, z, netherData);
  const spawnDistance = calculateEuclideanDistance(x, z, 0, netherData.spawn.x, netherData.spawn.z, 0);
  
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
  
  const distance = calculateEuclideanDistance(x, z, 0, nearestStop.stop.x, nearestStop.stop.z, 0);
  
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

function findNearestStop(x: number, z: number, data: NetherData): NearestStop {
  let nearestStop: NearestStop | null = null;
  
  Object.entries(data.axes).forEach(([axisName, stops]) => {
    stops.forEach(stop => {
      const distance = calculateEuclideanDistance(x, z, 0, stop.x, stop.z, 0);
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

async function callNearestPortals(x: number, y: number, z: number, world: string, maxDistance?: number): Promise<(Portal & {distance: number})[]> {
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

async function callLinkedPortal(x: number, y: number, z: number, fromWorld: string): Promise<(Portal & {distance: number}) | null> {
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
        searchCoords.x, y, searchCoords.z,
        portal.coordinates.x, portal.coordinates.y, portal.coordinates.z
      )
    }))
    .sort((a, b) => a.distance - b.distance);
  
  return candidatePortals.length > 0 ? candidatePortals[0] : null;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Normalize world names before Zod validation
    const rawFromWorld = searchParams.get('from_world');
    const rawToWorld = searchParams.get('to_world');
    const normalizedFromWorld = rawFromWorld ? normalizeWorldName(rawFromWorld) : null;
    const normalizedToWorld = rawToWorld ? normalizeWorldName(rawToWorld) : null;
    
    const params = QuerySchema.parse({
      from_x: searchParams.get('from_x'),
      from_y: searchParams.get('from_y'),
      from_z: searchParams.get('from_z'),
      from_world: normalizedFromWorld,
      from_place_id: searchParams.get('from_place_id'),
      to_x: searchParams.get('to_x'),
      to_y: searchParams.get('to_y'),
      to_z: searchParams.get('to_z'),
      to_world: normalizedToWorld,
      to_place_id: searchParams.get('to_place_id'),
    });

    // Validate input parameters
    const hasFromCoords = params.from_x !== undefined && params.from_z !== undefined && params.from_world;
    const hasFromPlace = params.from_place_id;
    const hasToCoords = params.to_x !== undefined && params.to_z !== undefined && params.to_world;
    const hasToPlace = params.to_place_id;
    
    if (!hasFromCoords && !hasFromPlace) {
      return NextResponse.json(
        { error: 'Either from coordinates (from_x, from_z, from_world) or from_place_id must be provided' },
        { status: 400 }
      );
    }
    
    if (!hasToCoords && !hasToPlace) {
      return NextResponse.json(
        { error: 'Either to coordinates (to_x, to_z, to_world) or to_place_id must be provided' },
        { status: 400 }
      );
    }

    // Load places and portals if needed
    const places = await loadPlaces();
    const portals = await loadPortals();
    
    // Resolve from point
    let fromPoint: RoutePoint;
    if (hasFromPlace) {
      // Check places first, then portals
      let place = places.find(p => p.id === params.from_place_id);
      if (!place) {
        place = portals.find(p => p.id === params.from_place_id);
      }
      if (!place) {
        return NextResponse.json(
          { error: `Place or portal with id '${params.from_place_id}' not found` },
          { status: 404 }
        );
      }
      fromPoint = {
        coordinates: place.coordinates,
        world: place.world,
        name: place.name,
        id: place.id
      };
    } else {
      fromPoint = {
        coordinates: {
          x: params.from_x!,
          y: params.from_y || 70,
          z: params.from_z!
        },
        world: params.from_world!
      };
    }
    
    // Resolve to point
    let toPoint: RoutePoint;
    if (hasToPlace) {
      // Check places first, then portals
      let place = places.find(p => p.id === params.to_place_id);
      if (!place) {
        place = portals.find(p => p.id === params.to_place_id);
      }
      if (!place) {
        return NextResponse.json(
          { error: `Place or portal with id '${params.to_place_id}' not found` },
          { status: 404 }
        );
      }
      toPoint = {
        coordinates: place.coordinates,
        world: place.world,
        name: place.name,
        id: place.id
      };
    } else {
      toPoint = {
        coordinates: {
          x: params.to_x!,
          y: params.to_y || 70,
          z: params.to_z!
        },
        world: params.to_world!
      };
    }

    // Determine routing case and execute
    const fromWorld = fromPoint.world;
    const toWorld = toPoint.world;
    
    if (fromWorld === 'overworld' && toWorld === 'overworld') {
      return await handleOverworldToOverworld(fromPoint, toPoint);
    } else if (fromWorld === 'nether' && toWorld === 'nether') {
      return await handleNetherToNether(fromPoint, toPoint);
    } else if (fromWorld === 'overworld' && toWorld === 'nether') {
      return await handleOverworldToNether(fromPoint, toPoint);
    } else if (fromWorld === 'nether' && toWorld === 'overworld') {
      return await handleNetherToOverworld(fromPoint, toPoint);
    }
    
    return NextResponse.json(
      { error: 'Invalid world combination' },
      { status: 400 }
    );
    
  } catch (error) {
    console.error('Error calculating route:', error);
    return NextResponse.json(
      { error: 'Failed to calculate route' },
      { status: 500 }
    );
  }
}

async function handleOverworldToOverworld(fromPoint: RoutePoint, toPoint: RoutePoint) {
  const directDistance = calculateEuclideanDistance(
    fromPoint.coordinates.x, fromPoint.coordinates.y, fromPoint.coordinates.z,
    toPoint.coordinates.x, toPoint.coordinates.y, toPoint.coordinates.z
  );
  
  // Option A: Direct route
  const directRoute = {
    player_from: {
      coordinates: fromPoint.coordinates,
      world: fromPoint.world
    },
    total_distance: directDistance,
    steps: [
      {
        type: "overworld_transport",
        distance: directDistance,
        from: fromPoint.coordinates,
        to: {
          id: toPoint.id || "destination",
          name: toPoint.name || "Destination",
          coordinates: toPoint.coordinates
        }
      }
    ]
  };
  
  // Option B: Via nether
  const searchRadius = 0.8 * directDistance;
  const nearbyPortalsFrom = await callNearestPortals(
    fromPoint.coordinates.x, fromPoint.coordinates.y, fromPoint.coordinates.z,
    'overworld', searchRadius
  );
  
  if (nearbyPortalsFrom.length === 0) {
    return NextResponse.json(directRoute);
  }
  
  const nearbyPortalsTo = await callNearestPortals(
    toPoint.coordinates.x, toPoint.coordinates.y, toPoint.coordinates.z,
    'overworld', searchRadius
  );
  
  if (nearbyPortalsTo.length === 0) {
    return NextResponse.json(directRoute);
  }
  
  // Try to find linked portals or calculate theoretical ones
  const portal1 = nearbyPortalsFrom[0];
  const linkedPortal1 = await callLinkedPortal(
    portal1.coordinates.x, portal1.coordinates.y, portal1.coordinates.z, 'overworld'
  );
  
  let portal1NetherCoords;
  let portal1Address;
  
  if (linkedPortal1) {
    portal1NetherCoords = linkedPortal1.coordinates;
    portal1Address = await callNetherAddress(portal1NetherCoords.x, portal1NetherCoords.y, portal1NetherCoords.z);
  } else {
    const theoreticalCoords = convertOverworldToNether(portal1.coordinates.x, portal1.coordinates.z);
    portal1NetherCoords = { x: theoreticalCoords.x, y: 70, z: theoreticalCoords.z };
    portal1Address = await callNetherAddress(portal1NetherCoords.x, portal1NetherCoords.y, portal1NetherCoords.z);
  }
  
  const portal2 = nearbyPortalsTo[0];
  const linkedPortal2 = await callLinkedPortal(
    portal2.coordinates.x, portal2.coordinates.y, portal2.coordinates.z, 'overworld'
  );
  
  if (!linkedPortal2) {
    return NextResponse.json(directRoute);
  }
  
  const portal2Address = await callNetherAddress(linkedPortal2.coordinates.x, linkedPortal2.coordinates.y, linkedPortal2.coordinates.z);
  
  // Use pre-calculated distances from the portal searches
  const distanceToPortal1 = portal1.distance;
  
  const netherDistance = calculateNetherNetworkDistance(portal1Address, portal2Address);
  
  const distanceFromPortal2 = portal2.distance;
  
  const totalNetherDistance = distanceToPortal1 + netherDistance + distanceFromPortal2;
  
  if (totalNetherDistance < directDistance) {
    // Return nether route
    return NextResponse.json({
      player_from: {
        coordinates: fromPoint.coordinates,
        world: fromPoint.world
      },
      total_distance: totalNetherDistance,
      steps: [
        {
          type: "overworld_transport",
          distance: distanceToPortal1,
          from: fromPoint.coordinates,
          to: {
            id: portal1.id,
            name: portal1.name,
            coordinates: portal1.coordinates
          }
        },
        {
          type: "portal",
          from: {
            id: portal1.id,
            name: portal1.name,
            coordinates: portal1.coordinates,
            world: "overworld"
          },
          to: {
            id: linkedPortal1?.id || `${portal1.id}_nether`,
            name: linkedPortal1?.name || `${portal1.name} (Nether)`,
            coordinates: portal1NetherCoords,
            world: "nether",
            address: portal1Address.address
          }
        },
        {
          type: "nether_transport",
          distance: netherDistance,
          from: {
            id: linkedPortal1?.id || `${portal1.id}_nether`,
            name: linkedPortal1?.name || `${portal1.name} (Nether)`,
            coordinates: portal1NetherCoords,
            address: portal1Address.address
          },
          to: {
            id: linkedPortal2.id,
            name: linkedPortal2.name,
            coordinates: linkedPortal2.coordinates,
            address: portal2Address.address
          }
        },
        {
          type: "portal",
          from: {
            id: linkedPortal2.id,
            name: linkedPortal2.name,
            coordinates: linkedPortal2.coordinates,
            world: "nether",
            address: portal2Address.address
          },
          to: {
            id: portal2.id,
            name: portal2.name,
            coordinates: portal2.coordinates,
            world: "overworld"
          }
        },
        {
          type: "overworld_transport",
          distance: distanceFromPortal2,
          from: {
            id: portal2.id,
            name: portal2.name,
            coordinates: portal2.coordinates
          },
          to: {
            id: toPoint.id || "destination",
            name: toPoint.name || "Destination",
            coordinates: toPoint.coordinates
          }
        }
      ]
    });
  }
  
  return NextResponse.json(directRoute);
}

async function handleNetherToNether(fromPoint: RoutePoint, toPoint: RoutePoint) {
  const fromAddress = await callNetherAddress(fromPoint.coordinates.x, fromPoint.coordinates.y, fromPoint.coordinates.z);
  const toAddress = await callNetherAddress(toPoint.coordinates.x, toPoint.coordinates.y, toPoint.coordinates.z);
  
  const distance = calculateNetherNetworkDistance(fromAddress, toAddress);
  
  return NextResponse.json({
    player_from: {
      coordinates: fromPoint.coordinates,
      world: fromPoint.world
    },
    total_distance: distance,
    steps: [
      {
        type: "nether_transport",
        distance: distance,
        from: {
          name: fromPoint.name || "Position de départ",
          coordinates: fromPoint.coordinates,
          address: fromAddress.address
        },
        to: {
          id: toPoint.id || "destination",
          name: toPoint.name || "Destination",
          coordinates: toPoint.coordinates,
          address: toAddress.address
        }
      }
    ]
  });
}

async function handleOverworldToNether(fromPoint: RoutePoint, toPoint: RoutePoint) {
  const nearbyPortals = await callNearestPortals(
    fromPoint.coordinates.x, fromPoint.coordinates.y, fromPoint.coordinates.z,
    'overworld'
  );
  
  if (nearbyPortals.length === 0) {
    return NextResponse.json(
      { error: 'No overworld portals found' },
      { status: 404 }
    );
  }
  
  const portal = nearbyPortals[0];
  const linkedPortal = await callLinkedPortal(
    portal.coordinates.x, portal.coordinates.y, portal.coordinates.z, 'overworld'
  );
  
  let portalNetherCoords;
  let portalAddress;
  
  if (linkedPortal) {
    portalNetherCoords = linkedPortal.coordinates;
    portalAddress = await callNetherAddress(portalNetherCoords.x, portalNetherCoords.y, portalNetherCoords.z);
  } else {
    const theoreticalCoords = convertOverworldToNether(portal.coordinates.x, portal.coordinates.z);
    portalNetherCoords = { x: theoreticalCoords.x, y: 70, z: theoreticalCoords.z };
    portalAddress = await callNetherAddress(portalNetherCoords.x, portalNetherCoords.y, portalNetherCoords.z);
  }
  
  const toAddress = await callNetherAddress(toPoint.coordinates.x, toPoint.coordinates.y, toPoint.coordinates.z);
  
  const distanceToPortal = portal.distance;
  
  const netherDistance = calculateNetherNetworkDistance(portalAddress, toAddress);
  const totalDistance = distanceToPortal + netherDistance;
  
  return NextResponse.json({
    player_from: {
      coordinates: fromPoint.coordinates,
      world: fromPoint.world
    },
    total_distance: totalDistance,
    steps: [
      {
        type: "overworld_transport",
        distance: distanceToPortal,
        from: fromPoint.coordinates,
        to: {
          id: portal.id,
          name: portal.name,
          coordinates: portal.coordinates
        }
      },
      {
        type: "portal",
        from: {
          id: portal.id,
          name: portal.name,
          coordinates: portal.coordinates
        },
        to: {
          id: linkedPortal?.id || `${portal.id}_nether`,
          name: linkedPortal?.name || `${portal.name} (Nether)`,
          coordinates: portalNetherCoords,
          address: portalAddress.address
        }
      },
      {
        type: "nether_transport",
        distance: netherDistance,
        from: {
          id: linkedPortal?.id || `${portal.id}_nether`,
          name: linkedPortal?.name || `${portal.name} (Nether)`,
          coordinates: portalNetherCoords,
          address: portalAddress.address
        },
        to: {
          id: toPoint.id || "destination",
          name: toPoint.name || "Destination",
          coordinates: toPoint.coordinates,
          address: toAddress.address
        }
      }
    ]
  });
}

async function handleNetherToOverworld(fromPoint: RoutePoint, toPoint: RoutePoint) {
  const fromAddress = await callNetherAddress(fromPoint.coordinates.x, fromPoint.coordinates.y, fromPoint.coordinates.z);
  
  const nearbyPortals = await callNearestPortals(
    toPoint.coordinates.x, toPoint.coordinates.y, toPoint.coordinates.z,
    'overworld'
  );
  
  if (nearbyPortals.length === 0) {
    return NextResponse.json(
      { error: 'No overworld portals found near destination' },
      { status: 404 }
    );
  }
  
  const portal = nearbyPortals[0];
  const linkedPortal = await callLinkedPortal(
    portal.coordinates.x, portal.coordinates.y, portal.coordinates.z, 'overworld'
  );
  
  let portalNetherCoords;
  let portalAddress;
  
  if (linkedPortal) {
    portalNetherCoords = linkedPortal.coordinates;
    portalAddress = await callNetherAddress(portalNetherCoords.x, portalNetherCoords.y, portalNetherCoords.z);
  } else {
    const theoreticalCoords = convertOverworldToNether(portal.coordinates.x, portal.coordinates.z);
    portalNetherCoords = { x: theoreticalCoords.x, y: 70, z: theoreticalCoords.z };
    portalAddress = await callNetherAddress(portalNetherCoords.x, portalNetherCoords.y, portalNetherCoords.z);
  }
  
  const netherDistance = calculateNetherNetworkDistance(fromAddress, portalAddress);
  
  const distanceFromPortal = portal.distance;
  
  const totalDistance = netherDistance + distanceFromPortal;
  
  return NextResponse.json({
    player_from: {
      coordinates: fromPoint.coordinates,
      world: fromPoint.world
    },
    total_distance: totalDistance,
    steps: [
      {
        type: "nether_transport",
        distance: netherDistance,
        from: {
          name: fromPoint.name || "Position de départ", 
          coordinates: fromPoint.coordinates,
          address: fromAddress.address
        },
        to: {
          id: linkedPortal?.id || `${portal.id}_nether`,
          name: linkedPortal?.name || `${portal.name} (Nether)`,
          coordinates: portalNetherCoords,
          address: portalAddress.address
        }
      },
      {
        type: "portal",
        from: {
          id: linkedPortal?.id || `${portal.id}_nether`,
          name: linkedPortal?.name || `${portal.name} (Nether)`,
          coordinates: portalNetherCoords,
          address: portalAddress.address
        },
        to: {
          id: portal.id,
          name: portal.name,
          coordinates: portal.coordinates
        }
      },
      {
        type: "overworld_transport",
        distance: distanceFromPortal,
        from: {
          id: portal.id,
          name: portal.name,
          coordinates: portal.coordinates
        },
        to: {
          id: toPoint.id || "destination",
          name: toPoint.name || "Destination",
          coordinates: toPoint.coordinates
        }
      }
    ]
  });
}

function calculateNetherNetworkDistance(address1: NetherAddress, address2: NetherAddress): number {
  // Simplified implementation - in reality this would calculate the actual network distance
  // based on the nether axes system described in DECISION.md
  
  // For now, return euclidean distance as approximation
  return calculateEuclideanDistance(
    address1.nearestStop.coordinates.x, address1.nearestStop.coordinates.y, address1.nearestStop.coordinates.z,
    address2.nearestStop.coordinates.x, address2.nearestStop.coordinates.y, address2.nearestStop.coordinates.z
  );
}