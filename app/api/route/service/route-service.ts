import { NextResponse } from 'next/server';
import {
  calculateEuclideanDistance,
  type Portal,
} from '../../utils/shared';
import { callNearestPortals } from '../route-utils';
import type { RoutePoint } from '../route-types';
import {
  buildNetherTransport,
  resolveNetherEndpoint,
  toDestinationLocation,
  toNetherEndpointLocation,
  toPortalLocation,
  toRoutePointStart,
} from './helpers';

export class RouteService {
  private portals: Portal[];

  constructor(portals: Portal[]) {
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
          from: toRoutePointStart(fromPoint),
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
    
    const netherTransport = buildNetherTransport(
      toNetherEndpointLocation(portal1NetherEndpoint),
      toNetherEndpointLocation(portal2NetherEndpoint)
    );
    const netherDistance = netherTransport.distance;
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
            from: toRoutePointStart(fromPoint),
            to: toPortalLocation(portal1)
          },
          {
            type: "portal",
            from: toPortalLocation(portal1, { world: "overworld" }),
            to: toNetherEndpointLocation(portal1NetherEndpoint, "nether")
          },
          ...netherTransport.steps,
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
    const netherTransport = buildNetherTransport(
      toRoutePointStart(fromPoint),
      toDestinationLocation(toPoint)
    );

    return NextResponse.json({
      player_from: {
        coordinates: fromPoint.coordinates,
        world: fromPoint.world
      },
      total_distance: netherTransport.distance,
      steps: netherTransport.steps
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
    
    const netherTransport = buildNetherTransport(
      toNetherEndpointLocation(netherEndpoint),
      toDestinationLocation(toPoint)
    );
    const netherDistance = netherTransport.distance;
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
          from: toRoutePointStart(fromPoint),
          to: toPortalLocation(portal)
        },
        {
          type: "portal",
          from: toPortalLocation(portal),
          to: toNetherEndpointLocation(netherEndpoint)
        },
        ...netherTransport.steps
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
    
    const netherTransport = buildNetherTransport(
      toRoutePointStart(fromPoint),
      toNetherEndpointLocation(netherEndpoint)
    );
    const netherDistance = netherTransport.distance;
    const distanceFromPortal = portal.distance;
    
    const totalDistance = netherDistance + distanceFromPortal;
    
    return NextResponse.json({
      player_from: {
        coordinates: fromPoint.coordinates,
        world: fromPoint.world
      },
      total_distance: totalDistance,
      steps: [
        ...netherTransport.steps,
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
