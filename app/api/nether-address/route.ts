import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { NetherStop, NetherData, loadNetherData, calculateEuclideanDistance } from '../utils/shared';

const QuerySchema = z.object({
  x: z.coerce.number(),
  y: z.coerce.number().optional(),
  z: z.coerce.number(),
});


function getAxisDirection(axisName: string): string {
  const directions: { [key: string]: string } = {
    'Nord': 'north',
    'Sud': 'south',
    'Ouest': 'west', 
    'Est': 'east',
    'Nord-Ouest': 'northwest',
    'Nord-Est': 'northeast',
    'Sud-Ouest': 'southwest',
    'Sud-Est': 'southeast'
  };
  return directions[axisName] || 'unknown';
}

function isMainAxis(axisName: string): boolean {
  return ['Nord', 'Sud', 'Ouest', 'Est'].includes(axisName);
}

function findSecondNearestAtSameLevel(
  targetX: number, 
  targetY: number,
  targetZ: number, 
  nearestStop: NetherStop, 
  axes: NetherData['axes'],
  excludeAxisName: string
): { axisName: string; stop: NetherStop; distance: number } | null {
  let secondNearest: { axisName: string; stop: NetherStop; distance: number } | null = null;
  
  Object.entries(axes).forEach(([axisName, stops]) => {
    if (axisName === excludeAxisName) return;
    
    const stopAtSameLevel = stops.find(stop => stop.level === nearestStop.level);
    if (stopAtSameLevel) {
      const distance = calculateEuclideanDistance(targetX, targetY, targetZ, stopAtSameLevel.x, stopAtSameLevel.y, stopAtSameLevel.z);
      if (!secondNearest || distance < secondNearest.distance) {
        secondNearest = {
          axisName: axisName,
          stop: stopAtSameLevel,
          distance
        };
      }
    }
  });
  
  return secondNearest;
}

function determineDirection(
  targetX: number,
  targetZ: number, 
  mainAxisName: string,
  mainAxisStop: NetherStop,
  secondAxisName: string,
  secondAxisStop: NetherStop
): string {
  const mainDirection = getAxisDirection(mainAxisName);
  const secondDirection = getAxisDirection(secondAxisName);
  
  // Determine left/right based on the relationship between main axis and second nearest
  if (mainDirection === 'north') {
    if (secondDirection === 'northeast' || secondDirection === 'east') return 'droite';
    if (secondDirection === 'northwest' || secondDirection === 'west') return 'gauche';
  } else if (mainDirection === 'south') {
    if (secondDirection === 'southeast' || secondDirection === 'east') return 'droite';  
    if (secondDirection === 'southwest' || secondDirection === 'west') return 'gauche';
  } else if (mainDirection === 'east') {
    if (secondDirection === 'northeast' || secondDirection === 'north') return 'gauche';
    if (secondDirection === 'southeast' || secondDirection === 'south') return 'droite';
  } else if (mainDirection === 'west') {
    if (secondDirection === 'northwest' || secondDirection === 'north') return 'droite';
    if (secondDirection === 'southwest' || secondDirection === 'south') return 'gauche';
  }
  
  // Fallback: use coordinate comparison
  if (mainDirection === 'north' || mainDirection === 'south') {
    return targetX > mainAxisStop.x ? 'droite' : 'gauche';
  } else {
    return targetZ < mainAxisStop.z ? 'droite' : 'gauche';
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const { x, y, z } = QuerySchema.parse({
      x: searchParams.get('x'),
      y: searchParams.get('y') || undefined,
      z: searchParams.get('z'),
    });

    // Load nether axes data
    const data = await loadNetherData();

    // Find the nearest stop across all axes
    let nearestStop: { axisName: string; stop: NetherStop; distance: number } | null = null;
    
    Object.entries(data.axes).forEach(([axisName, stops]) => {
      stops.forEach(stop => {
        const distance = calculateEuclideanDistance(x, y || 70, z, stop.x, stop.y, stop.z);
        if (!nearestStop || distance < nearestStop.distance) {
          nearestStop = {
            axisName: axisName,
            stop,
            distance
          };
        }
      });
    });

    if (!nearestStop) {
      return NextResponse.json(
        { error: 'No nether stops found' },
        { status: 404 }
      );
    }

    // At this point nearestStop is guaranteed to exist due to the null check above
    const guaranteedNearestStop = nearestStop as { axisName: string; stop: NetherStop; distance: number };
    
    // Check if spawn is nearer than the nearest stop
    const spawnDistance = calculateEuclideanDistance(x, y || 70, z, data.spawn.x, data.spawn.y, data.spawn.z);
    if (spawnDistance < guaranteedNearestStop.distance) {
      return NextResponse.json({
        address: "Spawn",
        nearestStop: {
          axis: "Spawn",
          level: null,
          coordinates: { x: data.spawn.x, y: data.spawn.y, z: data.spawn.z },
          distance: spawnDistance
        }
      });
    }

    // If the nearest stop is on a main axis and distance > 10 blocks, find second nearest at same level
    if (isMainAxis(guaranteedNearestStop.axisName) && guaranteedNearestStop.distance > 10) {
      const secondNearest = findSecondNearestAtSameLevel(
        x, y || 70, z, guaranteedNearestStop.stop, data.axes, 
        Object.keys(data.axes).find(key => key === guaranteedNearestStop.axisName) || ''
      );

      if (secondNearest) {
        const direction = determineDirection(
          x, z,
          guaranteedNearestStop.axisName,
          guaranteedNearestStop.stop,
          secondNearest.axisName,
          secondNearest.stop
        );

        return NextResponse.json({
          address: `${guaranteedNearestStop.axisName} ${guaranteedNearestStop.stop.level} ${direction}`,
          nearestStop: {
            axis: guaranteedNearestStop.axisName,
            level: guaranteedNearestStop.stop.level,
            coordinates: { x: guaranteedNearestStop.stop.x, y: guaranteedNearestStop.stop.y, z: guaranteedNearestStop.stop.z },
            distance: guaranteedNearestStop.distance
          },
          direction
        });
      }
    }

    // For diagonal axes or when no second nearest found, return simple address
    return NextResponse.json({
      address: `${guaranteedNearestStop.axisName} ${guaranteedNearestStop.stop.level}`,
      nearestStop: {
        axis: guaranteedNearestStop.axisName,
        level: guaranteedNearestStop.stop.level,
        coordinates: { x: guaranteedNearestStop.stop.x, y: guaranteedNearestStop.stop.y, z: guaranteedNearestStop.stop.z },
        distance: guaranteedNearestStop.distance
      }
    });

  } catch (error) {
    console.error('Error calculating nether address:', error);
    return NextResponse.json(
      { error: 'Failed to calculate nether address' },
      { status: 500 }
    );
  }
}