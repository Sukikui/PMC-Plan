import { Coordinate, Dimension } from './schemas';

// Nether to Overworld ratio (8:1)
const NETHER_RATIO = 8;

export function overworldToNether(coord: Coordinate): Coordinate {
  return {
    x: Math.floor(coord.x / NETHER_RATIO),
    y: coord.y, // Y coordinate doesn't change
    z: Math.floor(coord.z / NETHER_RATIO),
  };
}

export function netherToOverworld(coord: Coordinate): Coordinate {
  return {
    x: coord.x * NETHER_RATIO,
    y: coord.y, // Y coordinate doesn't change  
    z: coord.z * NETHER_RATIO,
  };
}

export function calculateDistance(coord1: Coordinate, coord2: Coordinate): number {
  const dx = coord2.x - coord1.x;
  const dy = coord2.y - coord1.y;
  const dz = coord2.z - coord1.z;
  
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

// Calculate 2D distance (ignoring Y coordinate for pathfinding)
export function calculate2DDistance(coord1: Coordinate, coord2: Coordinate): number {
  const dx = coord2.x - coord1.x;
  const dz = coord2.z - coord1.z;
  
  return Math.sqrt(dx * dx + dz * dz);
}

// Calculate Manhattan distance (for heuristic in A*)
export function calculateManhattanDistance(coord1: Coordinate, coord2: Coordinate): number {
  return Math.abs(coord2.x - coord1.x) + Math.abs(coord2.y - coord1.y) + Math.abs(coord2.z - coord1.z);
}

// Calculate effective distance considering dimension scaling
export function calculateEffectiveDistance(
  coord1: Coordinate, 
  dim1: Dimension,
  coord2: Coordinate, 
  dim2: Dimension
): number {
  // If both coordinates are in the same dimension, use regular distance
  if (dim1 === dim2) {
    return calculate2DDistance(coord1, coord2);
  }
  
  // If one is in overworld and other in nether, convert and calculate
  if ((dim1 === 'overworld' && dim2 === 'nether') || (dim1 === 'nether' && dim2 === 'overworld')) {
    let scaledCoord1 = coord1;
    let scaledCoord2 = coord2;
    
    if (dim1 === 'overworld') {
      scaledCoord1 = overworldToNether(coord1);
    } else {
      scaledCoord2 = overworldToNether(coord2);
    }
    
    return calculate2DDistance(scaledCoord1, scaledCoord2);
  }
  
  // For end dimension or other combinations, use large distance to discourage
  return 10000;
}

// Check if coordinates are within a certain range
export function isWithinRange(coord1: Coordinate, coord2: Coordinate, range: number): boolean {
  return calculate2DDistance(coord1, coord2) <= range;
}

// Get direction between two coordinates
export function getDirection(from: Coordinate, to: Coordinate): string {
  const dx = to.x - from.x;
  const dz = to.z - from.z;
  
  // Calculate angle in degrees
  const angle = Math.atan2(dz, dx) * (180 / Math.PI);
  
  // Normalize angle to 0-360
  const normalizedAngle = ((angle + 360) % 360);
  
  // Convert to cardinal directions
  if (normalizedAngle >= 337.5 || normalizedAngle < 22.5) return 'East';
  if (normalizedAngle >= 22.5 && normalizedAngle < 67.5) return 'Southeast';
  if (normalizedAngle >= 67.5 && normalizedAngle < 112.5) return 'South';
  if (normalizedAngle >= 112.5 && normalizedAngle < 157.5) return 'Southwest';
  if (normalizedAngle >= 157.5 && normalizedAngle < 202.5) return 'West';
  if (normalizedAngle >= 202.5 && normalizedAngle < 247.5) return 'Northwest';
  if (normalizedAngle >= 247.5 && normalizedAngle < 292.5) return 'North';
  if (normalizedAngle >= 292.5 && normalizedAngle < 337.5) return 'Northeast';
  
  return 'Unknown';
}

// Find the closest coordinate from a list
export function findClosest(target: Coordinate, candidates: { coordinates: Coordinate }[]): { coordinates: Coordinate } | null {
  if (candidates.length === 0) return null;
  
  let closest = candidates[0];
  let minDistance = calculate2DDistance(target, closest.coordinates);
  
  for (let i = 1; i < candidates.length; i++) {
    const distance = calculate2DDistance(target, candidates[i].coordinates);
    if (distance < minDistance) {
      minDistance = distance;
      closest = candidates[i];
    }
  }
  
  return closest;
}