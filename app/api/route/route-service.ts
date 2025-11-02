import { NextResponse } from 'next/server';
import { 
  calculateEuclideanDistance,
  convertOverworldToNether 
} from '../utils/shared';
import { callNearestPortals, callLinkedPortal } from './route-utils';
import { RoutePoint } from './route-types';

import { Place, Portal } from '../utils/shared'; // Add this import

export class RouteService {
    private portals: Portal[];

    constructor(places: Place[], portals: Portal[]) {
        this.portals = portals;
  }

  async handleOverworldToOverworld(fromPoint: RoutePoint, toPoint: RoutePoint) {
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
    const searchRadius = directDistance;
    const nearbyPortalsFrom = await callNearestPortals(
      fromPoint.coordinates.x, fromPoint.coordinates.y, fromPoint.coordinates.z,
      'overworld', this.portals, searchRadius
    );
    
    if (nearbyPortalsFrom.length === 0) {
      return NextResponse.json(directRoute);
    }
    
    const nearbyPortalsTo = await callNearestPortals(
      toPoint.coordinates.x, toPoint.coordinates.y, toPoint.coordinates.z,
      'overworld', this.portals, searchRadius
    );
    
    if (nearbyPortalsTo.length === 0) {
      return NextResponse.json(directRoute);
    }
    
    // Try to find linked portals or calculate theoretical ones
    const portal1 = nearbyPortalsFrom[0];
    const linkedPortal1 = await callLinkedPortal(
      portal1.coordinates.x, portal1.coordinates.y, portal1.coordinates.z, 'overworld', this.portals
    );
    
    let portal1NetherCoords;
    let portal1Address: string | undefined;

    if (linkedPortal1) {
      portal1NetherCoords = linkedPortal1.coordinates;
      portal1Address = linkedPortal1.address;
    } else {
      const theoreticalCoords = convertOverworldToNether(portal1.coordinates.x, portal1.coordinates.z);
      portal1NetherCoords = { x: theoreticalCoords.x, y: 70, z: theoreticalCoords.z };
      portal1Address = '';
    }

    const portal2 = nearbyPortalsTo[0];
    const linkedPortal2 = await callLinkedPortal(
      portal2.coordinates.x, portal2.coordinates.y, portal2.coordinates.z, 'overworld', this.portals
    );

    if (!linkedPortal2) {
      return NextResponse.json(directRoute);
    }

    const portal2Address = linkedPortal2.address;
    
    // Use pre-calculated distances from the portal searches
    const distanceToPortal1 = portal1.distance;
    
    const netherDistance = calculateEuclideanDistance(
      portal1NetherCoords.x, portal1NetherCoords.y, portal1NetherCoords.z,
      linkedPortal2.coordinates.x, linkedPortal2.coordinates.y, linkedPortal2.coordinates.z
    );
    
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
              id: linkedPortal1?.id || ``,
              name: linkedPortal1?.name || ``,
              coordinates: portal1NetherCoords,
              world: "nether",
              address: portal1Address
            }
          },
          ...(netherDistance > 0 ? [{
            type: "nether_transport",
            distance: netherDistance,
            from: {
              id: linkedPortal1?.id || ``,
              name: linkedPortal1?.name || ``,
              coordinates: portal1NetherCoords,
              address: portal1Address
            },
            to: {
              id: linkedPortal2.id,
              name: linkedPortal2.name,
              coordinates: linkedPortal2.coordinates,
              address: portal2Address
            }
          }] : []),
          {
            type: "portal",
            from: {
              id: linkedPortal2.id,
              name: linkedPortal2.name,
              coordinates: linkedPortal2.coordinates,
              world: "nether",
              address: portal2Address
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

  async handleNetherToNether(fromPoint: RoutePoint, toPoint: RoutePoint) {
    const distance = calculateEuclideanDistance(
      fromPoint.coordinates.x, fromPoint.coordinates.y, fromPoint.coordinates.z,
      toPoint.coordinates.x, toPoint.coordinates.y, toPoint.coordinates.z
    );
    
    const steps = distance > 0 ? [
      {
        type: "nether_transport",
        distance: distance,
        from: {
          name: fromPoint.name || "Position de départ",
          coordinates: fromPoint.coordinates,
          address: fromPoint.address
        },
        to: {
          id: toPoint.id || "destination",
          name: toPoint.name || "Destination",
          coordinates: toPoint.coordinates,
          address: toPoint.address
        }
      }
    ] : [];

    return NextResponse.json({
      player_from: {
        coordinates: fromPoint.coordinates,
        world: fromPoint.world
      },
      total_distance: distance,
      steps: steps
    });
  }

  async handleOverworldToNether(fromPoint: RoutePoint, toPoint: RoutePoint) {
    const nearbyPortals = await callNearestPortals(
      fromPoint.coordinates.x, fromPoint.coordinates.y, fromPoint.coordinates.z,
      'overworld', this.portals
    );
    
    if (nearbyPortals.length === 0) {
      return NextResponse.json(
        { error: 'No overworld portals found' },
        { status: 404 }
      );
    }
    
    const portal = nearbyPortals[0];
    const linkedPortal = await callLinkedPortal(
      portal.coordinates.x, portal.coordinates.y, portal.coordinates.z, 'overworld', this.portals
    );
    
    let portalNetherCoords;
    let portalAddress: string | undefined;

    if (linkedPortal) {
      portalNetherCoords = linkedPortal.coordinates;
      portalAddress = linkedPortal.address;
    } else {
      const theoreticalCoords = convertOverworldToNether(portal.coordinates.x, portal.coordinates.z);
      portalNetherCoords = { x: theoreticalCoords.x, y: 70, z: theoreticalCoords.z };
      portalAddress = '';
    }

    const toAddress = toPoint.address;
    
    const distanceToPortal = portal.distance;
    
    const netherDistance = calculateEuclideanDistance(
      portalNetherCoords.x, portalNetherCoords.y, portalNetherCoords.z,
      toPoint.coordinates.x, toPoint.coordinates.y, toPoint.coordinates.z
    );
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
            id: linkedPortal?.id || ``,
            name: linkedPortal?.name || ``,
            coordinates: portalNetherCoords,
            address: portalAddress
          }
        },
        ...(netherDistance > 0 ? [{
          type: "nether_transport",
          distance: netherDistance,
          from: {
            id: linkedPortal?.id || ``,
            name: linkedPortal?.name || ``,
            coordinates: portalNetherCoords,
            address: portalAddress
          },
          to: {
            id: toPoint.id || "destination",
            name: toPoint.name || "Destination",
            coordinates: toPoint.coordinates,
            address: toAddress
          }
        }] : [])
      ]
    });
  }

  async handleNetherToOverworld(fromPoint: RoutePoint, toPoint: RoutePoint) {
    const nearbyPortals = await callNearestPortals(
      toPoint.coordinates.x, toPoint.coordinates.y, toPoint.coordinates.z,
      'overworld', this.portals
    );
    
    if (nearbyPortals.length === 0) {
      return NextResponse.json(
        { error: 'No overworld portals found near destination' },
        { status: 404 }
      );
    }
    
    const portal = nearbyPortals[0];
    const linkedPortal = await callLinkedPortal(
      portal.coordinates.x, portal.coordinates.y, portal.coordinates.z, 'overworld', this.portals
    );
    
    let portalNetherCoords;
    let portalAddress: string | undefined;

    if (linkedPortal) {
      portalNetherCoords = linkedPortal.coordinates;
      portalAddress = linkedPortal.address;
    } else {
      const theoreticalCoords = convertOverworldToNether(portal.coordinates.x, portal.coordinates.z);
      portalNetherCoords = { x: theoreticalCoords.x, y: 70, z: theoreticalCoords.z };
      portalAddress = '';
    }
    
    const netherDistance = calculateEuclideanDistance(
      fromPoint.coordinates.x, fromPoint.coordinates.y, fromPoint.coordinates.z,
      portalNetherCoords.x, portalNetherCoords.y, portalNetherCoords.z
    );
    
    const distanceFromPortal = portal.distance;
    
    const totalDistance = netherDistance + distanceFromPortal;
    
    return NextResponse.json({
      player_from: {
        coordinates: fromPoint.coordinates,
        world: fromPoint.world
      },
      total_distance: totalDistance,
      steps: [
        ...(netherDistance > 0 ? [{
          type: "nether_transport",
          distance: netherDistance,
          from: {
            name: fromPoint.name || "Position de départ", 
            coordinates: fromPoint.coordinates,
            address: fromPoint.address
          },
          to: {
            id: linkedPortal?.id || ``,
            name: linkedPortal?.name || ``,
            coordinates: portalNetherCoords,
            address: portalAddress
          }
        }] : []),
        {
          type: "portal",
          from: {
            id: linkedPortal?.id || ``,
            name: linkedPortal?.name || ``,
            coordinates: portalNetherCoords,
            address: portalAddress
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
}