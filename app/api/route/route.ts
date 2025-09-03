import { NextRequest, NextResponse } from 'next/server';
import {
  loadPlaces,
  loadPortals,
} from '../utils/shared';
import { normalizeWorldName } from '../../../lib/world-utils';
import { QuerySchema, RoutePoint } from './route-types';
import { RouteService } from './route-service';

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

    const routeService = new RouteService();

    if (fromWorld === 'overworld' && toWorld === 'overworld') {
      return await routeService.handleOverworldToOverworld(fromPoint, toPoint);
    } else if (fromWorld === 'nether' && toWorld === 'nether') {
      return await routeService.handleNetherToNether(fromPoint, toPoint);
    } else if (fromWorld === 'overworld' && toWorld === 'nether') {
      return await routeService.handleOverworldToNether(fromPoint, toPoint);
    } else if (fromWorld === 'nether' && toWorld === 'overworld') {
      return await routeService.handleNetherToOverworld(fromPoint, toPoint);
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