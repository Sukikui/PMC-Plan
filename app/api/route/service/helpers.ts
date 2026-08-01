import {
  convertOverworldToNether,
  resolveNetherAddressForWorld,
} from '../../utils/shared';
import { calculateNetherRoute } from '@/lib/nether/routing';
import { callLinkedPortal } from '../route-utils';
import type { RoutePoint, RoutePortal, RoutePortalWithDistance } from '../route-types';

export interface ResolvedNetherEndpoint {
  linkedPortal: RoutePortalWithDistance | null;
  coordinates: RoutePortal['coordinates'];
  address?: string;
}

export async function resolveNetherEndpoint(
  overworldPortal: RoutePortal,
  allPortals: RoutePortal[]
): Promise<ResolvedNetherEndpoint> {
  const linkedPortal = await callLinkedPortal(
    overworldPortal.coordinates.x,
    overworldPortal.coordinates.y,
    overworldPortal.coordinates.z,
    'overworld',
    allPortals
  );

  if (linkedPortal) {
    return {
      linkedPortal,
      coordinates: linkedPortal.coordinates,
      address: await resolveNetherAddressForWorld('nether', linkedPortal.coordinates, linkedPortal.address) ?? undefined,
    };
  }

  const theoreticalCoords = convertOverworldToNether(
    overworldPortal.coordinates.x,
    overworldPortal.coordinates.z
  );
  const coordinates = { x: theoreticalCoords.x, y: 70, z: theoreticalCoords.z };

  return {
    linkedPortal: null,
    coordinates,
    address: await resolveNetherAddressForWorld('nether', coordinates) ?? undefined,
  };
}

export const toDestinationLocation = (point: RoutePoint) => ({
  id: point.id || 'destination',
  name: point.name || 'Destination',
  coordinates: point.coordinates,
  address: point.address,
});

export const toRoutePointStart = (point: RoutePoint) => ({
  name: point.name || 'Position de départ',
  coordinates: point.coordinates,
  address: point.address,
});

export const toPortalLocation = (
  portal: RoutePortal,
  options: { world?: string; address?: string } = {}
) => ({
  id: portal.id,
  name: portal.name,
  coordinates: portal.coordinates,
  ...options,
});

export const toNetherEndpointLocation = (
  endpoint: ResolvedNetherEndpoint,
  world?: string
) => ({
  id: endpoint.linkedPortal?.id || '',
  name: endpoint.linkedPortal?.name || '',
  coordinates: endpoint.coordinates,
  ...(world ? { world } : {}),
  address: endpoint.address,
});

interface NetherTransportLocation {
  coordinates: RoutePortal['coordinates'];
}

export const buildNetherTransport = <
  TFrom extends NetherTransportLocation,
  TTo extends NetherTransportLocation,
>(from: TFrom, to: TTo) => {
  const route = calculateNetherRoute(from.coordinates, to.coordinates);

  return {
    distance: route.distance,
    steps: route.distance > 0 ? [{
      type: 'nether_transport' as const,
      distance: route.distance,
      from,
      to,
      path: route.path,
    }] : [],
  };
};
