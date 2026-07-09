import { NextResponse } from 'next/server';
import {
  calculateEuclideanDistance,
  type Place,
  type Portal,
} from '../../utils/shared';
import { callNearestPortals } from '../route-utils';
import type { RoutePoint } from '../route-types';
import {
  resolveNetherEndpoint,
  toDestinationLocation,
  toNetherEndpointLocation,
  toPortalLocation,
  toRoutePointStart,
} from './helpers';

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
    const portal1NetherEndpoint = await resolveNetherEndpoint(portal1, this.portals);

    const portal2 = nearbyPortalsTo[0];
    const portal2NetherEndpoint = await resolveNetherEndpoint(portal2, this.portals);
    const linkedPortal2 = portal2NetherEndpoint.linkedPortal;

    if (!linkedPortal2) {
      return NextResponse.json(directRoute);
    }
    
    // Use pre-calculated distances from the portal searches
    const distanceToPortal1 = portal1.distance;
    
    const netherDistance = calculateEuclideanDistance(
      portal1NetherEndpoint.coordinates.x, portal1NetherEndpoint.coordinates.y, portal1NetherEndpoint.coordinates.z,
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
            to: toPortalLocation(portal1)
          },
          {
            type: "portal",
            from: toPortalLocation(portal1, { world: "overworld" }),
            to: toNetherEndpointLocation(portal1NetherEndpoint, "nether")
          },
          ...(netherDistance > 0 ? [{
            type: "nether_transport",
            distance: netherDistance,
            from: toNetherEndpointLocation(portal1NetherEndpoint),
            to: toNetherEndpointLocation(portal2NetherEndpoint)
          }] : []),
          {
            type: "portal",
            from: toNetherEndpointLocation(portal2NetherEndpoint, "nether"),
            to: toPortalLocation(portal2, { world: "overworld" })
          },
          {
            type: "overworld_transport",
            distance: distanceFromPortal2,
            from: toPortalLocation(portal2),
            to: toDestinationLocation(toPoint)
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
          from: toRoutePointStart(fromPoint),
          to: toDestinationLocation(toPoint)
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
    const netherEndpoint = await resolveNetherEndpoint(portal, this.portals);
    
    const distanceToPortal = portal.distance;
    
    const netherDistance = calculateEuclideanDistance(
      netherEndpoint.coordinates.x, netherEndpoint.coordinates.y, netherEndpoint.coordinates.z,
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
          to: toPortalLocation(portal)
        },
        {
          type: "portal",
          from: toPortalLocation(portal),
          to: toNetherEndpointLocation(netherEndpoint)
        },
        ...(netherDistance > 0 ? [{
          type: "nether_transport",
          distance: netherDistance,
          from: toNetherEndpointLocation(netherEndpoint),
          to: toDestinationLocation(toPoint)
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
    const netherEndpoint = await resolveNetherEndpoint(portal, this.portals);
    
    const netherDistance = calculateEuclideanDistance(
      fromPoint.coordinates.x, fromPoint.coordinates.y, fromPoint.coordinates.z,
      netherEndpoint.coordinates.x, netherEndpoint.coordinates.y, netherEndpoint.coordinates.z
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
          from: toRoutePointStart(fromPoint),
          to: toNetherEndpointLocation(netherEndpoint)
        }] : []),
        {
          type: "portal",
          from: toNetherEndpointLocation(netherEndpoint),
          to: toPortalLocation(portal)
        },
        {
          type: "overworld_transport",
          distance: distanceFromPortal,
          from: toPortalLocation(portal),
          to: toDestinationLocation(toPoint)
        }
      ]
    });
  }
}
