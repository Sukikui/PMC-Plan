import { Path, PathSegment } from './schemas';
import { getDirection } from './coords';

interface DirectionStep {
  step: number;
  instruction: string;
  distance: number;
  coordinates: { x: number; y: number; z: number };
  dimension: string;
  type: 'walk' | 'portal' | 'axis';
}

export function generateDirections(path: Path): DirectionStep[] {
  const directions: DirectionStep[] = [];
  let currentPos = path.startCoordinates;
  
  path.segments.forEach((segment, index) => {
    const stepNumber = index + 1;
    let instruction = '';
    
    // Generate instruction based on segment type
    switch (segment.type) {
      case 'walk':
        if (segment.distance > 0) {
          const direction = getDirection(currentPos, segment.coordinates);
          instruction = `Walk ${direction} for ${Math.round(segment.distance)} blocks`;
          
          if (segment.instructions) {
            instruction += ` to ${segment.instructions.replace('Walk to ', '')}`;
          }
        } else {
          instruction = segment.instructions || 'You have arrived';
        }
        break;
        
      case 'portal':
        instruction = segment.instructions || 'Use the portal';
        if (segment.portalId) {
          instruction += ` (Portal ID: ${segment.portalId})`;
        }
        break;
        
      case 'axis':
        const direction = getDirection(currentPos, segment.coordinates);
        instruction = `Follow the tunnel ${direction}`;
        if (segment.distance > 0) {
          instruction += ` for ${Math.round(segment.distance)} blocks`;
        }
        if (segment.axisId) {
          instruction += ` along ${segment.axisId} axis`;
        }
        break;
        
      default:
        instruction = segment.instructions || 'Continue';
    }
    
    directions.push({
      step: stepNumber,
      instruction,
      distance: Math.round(segment.distance),
      coordinates: {
        x: Math.round(segment.coordinates.x),
        y: Math.round(segment.coordinates.y),
        z: Math.round(segment.coordinates.z),
      },
      dimension: segment.dimension,
      type: segment.type,
    });
    
    // Update current position for next direction calculation
    currentPos = segment.coordinates;
  });
  
  return directions;
}

// Generate a summary of the route
export function generateRouteSummary(path: Path): string {
  const totalDistance = Math.round(path.totalDistance);
  const segmentCount = path.segments.length;
  
  // Count different segment types
  const walkSegments = path.segments.filter(s => s.type === 'walk').length;
  const portalSegments = path.segments.filter(s => s.type === 'portal').length;
  const axisSegments = path.segments.filter(s => s.type === 'axis').length;
  
  let summary = `Route: ${totalDistance} blocks total, ${segmentCount} steps`;
  
  const parts: string[] = [];
  if (walkSegments > 0) parts.push(`${walkSegments} walk${walkSegments > 1 ? 's' : ''}`);
  if (portalSegments > 0) parts.push(`${portalSegments} portal${portalSegments > 1 ? 's' : ''}`);
  if (axisSegments > 0) parts.push(`${axisSegments} tunnel${axisSegments > 1 ? 's' : ''}`);
  
  if (parts.length > 0) {
    summary += ` (${parts.join(', ')})`;
  }
  
  // Estimate travel time (assuming 4.3 blocks/second walking speed)
  const walkingSpeed = 4.3; // blocks per second
  const estimatedTimeSeconds = Math.round(totalDistance / walkingSpeed);
  const minutes = Math.floor(estimatedTimeSeconds / 60);
  const seconds = estimatedTimeSeconds % 60;
  
  if (minutes > 0) {
    summary += `. Estimated time: ${minutes}m ${seconds}s`;
  } else {
    summary += `. Estimated time: ${seconds}s`;
  }
  
  return summary;
}

// Generate turn-by-turn navigation text
export function generateNavigationText(path: Path): string {
  const directions = generateDirections(path);
  const summary = generateRouteSummary(path);
  
  let text = `${summary}\n\n`;
  
  directions.forEach(direction => {
    text += `${direction.step}. ${direction.instruction}`;
    
    if (direction.distance > 0) {
      text += ` (${direction.distance}m)`;
    }
    
    text += `\n   → ${direction.dimension}: ${direction.coordinates.x}, ${direction.coordinates.y}, ${direction.coordinates.z}\n\n`;
  });
  
  return text.trim();
}

// Get waypoint coordinates for map display
export function getWaypoints(path: Path): Array<{ x: number; y: number; z: number; type: string; dimension: string }> {
  const waypoints = [
    {
      x: path.startCoordinates.x,
      y: path.startCoordinates.y,
      z: path.startCoordinates.z,
      type: 'start',
      dimension: path.segments[0]?.dimension || 'overworld',
    }
  ];
  
  path.segments.forEach(segment => {
    waypoints.push({
      x: segment.coordinates.x,
      y: segment.coordinates.y,
      z: segment.coordinates.z,
      type: segment.type,
      dimension: segment.dimension,
    });
  });
  
  return waypoints;
}

// Format coordinates for display
export function formatCoordinates(x: number, y: number, z: number): string {
  return `${Math.round(x)}, ${Math.round(y)}, ${Math.round(z)}`;
}

// Calculate bearing between two points (0-360 degrees, 0 = North)
export function calculateBearing(from: { x: number; z: number }, to: { x: number; z: number }): number {
  const dx = to.x - from.x;
  const dz = to.z - from.z;
  
  // Calculate angle in radians (0 = East, π/2 = South)
  let angle = Math.atan2(dz, dx);
  
  // Convert to degrees and rotate so 0 = North
  let bearing = (90 - (angle * 180 / Math.PI)) % 360;
  
  // Ensure positive
  if (bearing < 0) bearing += 360;
  
  return Math.round(bearing);
}

// Convert bearing to compass direction
export function bearingToCompass(bearing: number): string {
  const directions = [
    'N', 'NNE', 'NE', 'ENE',
    'E', 'ESE', 'SE', 'SSE',
    'S', 'SSW', 'SW', 'WSW',
    'W', 'WNW', 'NW', 'NNW'
  ];
  
  const index = Math.round(bearing / 22.5) % 16;
  return directions[index];
}