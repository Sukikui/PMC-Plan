import { NextRequest, NextResponse } from 'next/server';
import {
  loadPlaces,
  loadPortals,
} from '../utils/shared';
import { QuerySchema } from './route-types';
import { RouteService } from './route-service';
import { handleError, parseQueryParams } from '../utils/api-utils';
import { resolveRoutePoint } from './route-utils';

export async function GET(request: NextRequest) {
  try {
    const params = parseQueryParams(request.url, QuerySchema);

    // Validate input parameters
    const hasFromCoords = params.from_x !== undefined && params.from_z !== undefined && params.from_world;
    const hasFromPlace = !!params.from_place_id;
    const hasToCoords = params.to_x !== undefined && params.to_z !== undefined && params.to_world;
    const hasToPlace = !!params.to_place_id;

    if (!hasFromCoords && !hasFromPlace) {
      return NextResponse.json(
        { error: 'Either from coordinates (from_x, from_z) or from_place_id must be provided' },
        { status: 400 }
      );
    }

    if (!hasToCoords && !hasToPlace) {
      return NextResponse.json(
        { error: 'Either to coordinates (to_x, to_z) or to_place_id must be provided' },
        { status: 400 }
      );
    }

    // Load places and portals if needed
    const places = await loadPlaces();
    const portals = await loadPortals();

    // Resolve from point
    const fromPointResult = resolveRoutePoint(
      hasFromPlace,
      params.from_place_id,
      params.from_x,
      params.from_y,
      params.from_z,
      params.from_world,
      places,
      portals,
      'from'
    );
    if (fromPointResult instanceof NextResponse) {
      return fromPointResult;
    }
    const fromPoint = fromPointResult;

    // Resolve to point
    const toPointResult = resolveRoutePoint(
      hasToPlace,
      params.to_place_id,
      params.to_x,
      params.to_y,
      params.to_z,
      params.to_world,
      places,
      portals,
      'to'
    );
    if (toPointResult instanceof NextResponse) {
      return toPointResult;
    }
    const toPoint = toPointResult;

    // Determine routing case and execute
    const finalFromWorld = fromPoint.world;
    const finalToWorld = toPoint.world;

    const routeService = new RouteService(places, portals);

    if (finalFromWorld === 'overworld' && finalToWorld === 'overworld') {
      return await routeService.handleOverworldToOverworld(fromPoint, toPoint);
    } else if (finalFromWorld === 'nether' && finalToWorld === 'nether') {
      return await routeService.handleNetherToNether(fromPoint, toPoint);
    } else if (finalFromWorld === 'overworld' && finalToWorld === 'nether') {
      return await routeService.handleOverworldToNether(fromPoint, toPoint);
    } else if (finalFromWorld === 'nether' && finalToWorld === 'overworld') {
      return await routeService.handleNetherToOverworld(fromPoint, toPoint);
    }

    return NextResponse.json(
      { error: 'Invalid world combination' },
      { status: 400 }
    );

  } catch (error) {
    return handleError(error, 'Failed to calculate route');
  }
}