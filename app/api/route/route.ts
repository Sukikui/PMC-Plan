import { NextRequest, NextResponse } from 'next/server';
import { findPath } from '@/lib/pathfind';
import { generateDirections } from '@/lib/directions';
import { z } from 'zod';

const QuerySchema = z.object({
  fromDim: z.enum(['overworld', 'nether', 'end']),
  fromX: z.coerce.number(),
  fromY: z.coerce.number(),
  fromZ: z.coerce.number(),
  toId: z.string(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = QuerySchema.parse({
      fromDim: searchParams.get('fromDim'),
      fromX: searchParams.get('fromX'),
      fromY: searchParams.get('fromY'),
      fromZ: searchParams.get('fromZ'),
      toId: searchParams.get('toId'),
    });

    const startPos = {
      dim: query.fromDim,
      x: query.fromX,
      y: query.fromY,
      z: query.fromZ,
    };

    // Find optimal path using A* pathfinding
    const path = await findPath(startPos, query.toId);
    
    if (!path) {
      return NextResponse.json(
        { error: 'No path found to destination' },
        { status: 404 }
      );
    }

    // Generate human-readable directions
    const directions = generateDirections(path);

    return NextResponse.json({
      path,
      directions,
      totalDistance: path.totalDistance,
      segments: path.segments,
    });
  } catch (error) {
    console.error('Error calculating route:', error);
    return NextResponse.json(
      { error: 'Failed to calculate route' },
      { status: 500 }
    );
  }
}