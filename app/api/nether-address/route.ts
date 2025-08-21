import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { z } from 'zod';

const QuerySchema = z.object({
  x: z.coerce.number(),
  y: z.coerce.number().optional(),
  z: z.coerce.number(),
});

interface NetherStop {
  level: number;
  x: number;
  y: number;
  z: number;
}

interface NetherAxes {
  [key: string]: NetherStop[];
}

interface SpawnPoint {
  x: number;
  y: number;
  z: number;
}

interface NetherData {
  spawn: SpawnPoint;
  axes: NetherAxes;
}

function calculateDistance(x1: number, z1: number, x2: number, z2: number): number {
  const dx = x2 - x1;
  const dz = z2 - z1;
  return Math.sqrt(dx * dx + dz * dz);
}


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
  targetZ: number, 
  nearestStop: NetherStop, 
  axes: NetherAxes,
  excludeAxisName: string
): { axisName: string; stop: NetherStop; distance: number } | null {
  let secondNearest: { axisName: string; stop: NetherStop; distance: number } | null = null;
  
  Object.entries(axes).forEach(([axisName, stops]) => {
    if (axisName === excludeAxisName) return;
    
    const stopAtSameLevel = stops.find(stop => stop.level === nearestStop.level);
    if (stopAtSameLevel) {
      const distance = calculateDistance(targetX, targetZ, stopAtSameLevel.x, stopAtSameLevel.z);
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
    const axesFile = path.join(process.cwd(), 'public', 'data', 'nether_axes.json');
    const content = await fs.readFile(axesFile, 'utf-8');
    const data: NetherData = JSON.parse(content);

    // Find the nearest stop across all axes
    let nearestStop: { axisName: string; stop: NetherStop; distance: number } | null = null;
    
    Object.entries(data.axes).forEach(([axisName, stops]) => {
      stops.forEach(stop => {
        const distance = calculateDistance(x, z, stop.x, stop.z);
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

    // Check if spawn is nearer than the nearest stop
    const spawnDistance = calculateDistance(x, z, data.spawn.x, data.spawn.z);
    if (spawnDistance < nearestStop.distance) {
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
    if (isMainAxis(nearestStop.axisName) && nearestStop.distance > 10) {
      const secondNearest = findSecondNearestAtSameLevel(
        x, z, nearestStop.stop, data.axes, 
Object.keys(data.axes).find(key => key === nearestStop!.axisName) || ''
      );

      if (secondNearest) {
        const direction = determineDirection(
          x, z,
          nearestStop.axisName,
          nearestStop.stop,
          secondNearest.axisName,
          secondNearest.stop
        );

        return NextResponse.json({
          address: `${nearestStop.axisName} ${nearestStop.stop.level} ${direction}`,
          nearestStop: {
            axis: nearestStop.axisName,
            level: nearestStop.stop.level,
            coordinates: { x: nearestStop.stop.x, y: nearestStop.stop.y, z: nearestStop.stop.z },
            distance: nearestStop.distance
          },
          direction
        });
      }
    }

    // For diagonal axes or when no second nearest found, return simple address
    return NextResponse.json({
      address: `${nearestStop.axisName} ${nearestStop.stop.level}`,
      nearestStop: {
        axis: nearestStop.axisName,
        level: nearestStop.stop.level,
        coordinates: { x: nearestStop.stop.x, y: nearestStop.stop.y, z: nearestStop.stop.z },
        distance: nearestStop.distance
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