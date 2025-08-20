import { Portal, NetherAxis, Coordinate } from './schemas';
import { calculate2DDistance, isWithinRange } from './coords';

// Distance threshold for connecting portals to axes (in blocks)
const AXIS_CONNECTION_THRESHOLD = 50;

export interface GraphNode {
  id: string;
  type: 'portal' | 'axis' | 'junction';
  coordinates: Coordinate;
  connections: GraphConnection[];
  portalId?: string;
  axisId?: string;
}

export interface GraphConnection {
  toNodeId: string;
  distance: number;
  type: 'tunnel' | 'walk';
  axisId?: string;
}

export interface NetherGraph {
  nodes: Map<string, GraphNode>;
  portals: Portal[];
  axes: NetherAxis[];
}

// Find the closest point on an axis to a given coordinate
function getClosestPointOnAxis(axis: NetherAxis, coord: Coordinate): Coordinate {
  const start = axis.startCoordinates;
  const end = axis.endCoordinates;
  
  // Vector from start to end
  const axisVector = {
    x: end.x - start.x,
    y: end.y - start.y,
    z: end.z - start.z,
  };
  
  // Vector from start to point
  const pointVector = {
    x: coord.x - start.x,
    y: coord.y - start.y,
    z: coord.z - start.z,
  };
  
  // Project point onto axis (ignore Y for 2D calculation)
  const axisLength2D = Math.sqrt(axisVector.x * axisVector.x + axisVector.z * axisVector.z);
  if (axisLength2D === 0) return start; // Degenerate case
  
  const dotProduct = (pointVector.x * axisVector.x + pointVector.z * axisVector.z);
  const projectionLength = dotProduct / (axisLength2D * axisLength2D);
  
  // Clamp to axis bounds
  const clampedProjection = Math.max(0, Math.min(1, projectionLength));
  
  return {
    x: start.x + clampedProjection * axisVector.x,
    y: coord.y, // Keep original Y coordinate
    z: start.z + clampedProjection * axisVector.z,
  };
}

// Build the nether navigation graph
export function buildNetherGraph(portals: Portal[], axes: NetherAxis[]): NetherGraph {
  const nodes = new Map<string, GraphNode>();
  
  // Filter to only nether portals that are active
  const netherPortals = portals.filter(p => p.dimension === 'nether' && p.isActive);
  
  // Add portal nodes
  for (const portal of netherPortals) {
    const nodeId = `portal_${portal.id}`;
    nodes.set(nodeId, {
      id: nodeId,
      type: 'portal',
      coordinates: portal.coordinates,
      connections: [],
      portalId: portal.id,
    });
  }
  
  // Add axis nodes and connect portals to nearby axes
  for (const axis of axes) {
    const axisStartNodeId = `axis_${axis.id}_start`;
    const axisEndNodeId = `axis_${axis.id}_end`;
    
    // Add axis endpoint nodes
    nodes.set(axisStartNodeId, {
      id: axisStartNodeId,
      type: 'axis',
      coordinates: axis.startCoordinates,
      connections: [],
      axisId: axis.id,
    });
    
    nodes.set(axisEndNodeId, {
      id: axisEndNodeId,
      type: 'axis',
      coordinates: axis.endCoordinates,
      connections: [],
      axisId: axis.id,
    });
    
    // Connect axis endpoints
    const axisDistance = calculate2DDistance(axis.startCoordinates, axis.endCoordinates);
    
    nodes.get(axisStartNodeId)!.connections.push({
      toNodeId: axisEndNodeId,
      distance: axisDistance,
      type: 'tunnel',
      axisId: axis.id,
    });
    
    nodes.get(axisEndNodeId)!.connections.push({
      toNodeId: axisStartNodeId,
      distance: axisDistance,
      type: 'tunnel',
      axisId: axis.id,
    });
    
    // Connect nearby portals to this axis
    for (const portal of netherPortals) {
      const portalNodeId = `portal_${portal.id}`;
      const closestPoint = getClosestPointOnAxis(axis, portal.coordinates);
      const distanceToAxis = calculate2DDistance(portal.coordinates, closestPoint);
      
      if (distanceToAxis <= AXIS_CONNECTION_THRESHOLD) {
        // Create a junction node on the axis for this portal
        const junctionNodeId = `junction_${axis.id}_${portal.id}`;
        nodes.set(junctionNodeId, {
          id: junctionNodeId,
          type: 'junction',
          coordinates: closestPoint,
          connections: [],
          axisId: axis.id,
        });
        
        // Connect portal to junction
        nodes.get(portalNodeId)!.connections.push({
          toNodeId: junctionNodeId,
          distance: distanceToAxis,
          type: 'walk',
        });
        
        nodes.get(junctionNodeId)!.connections.push({
          toNodeId: portalNodeId,
          distance: distanceToAxis,
          type: 'walk',
        });
        
        // Connect junction to both axis endpoints
        const distanceToStart = calculate2DDistance(closestPoint, axis.startCoordinates);
        const distanceToEnd = calculate2DDistance(closestPoint, axis.endCoordinates);
        
        nodes.get(junctionNodeId)!.connections.push({
          toNodeId: axisStartNodeId,
          distance: distanceToStart,
          type: 'tunnel',
          axisId: axis.id,
        });
        
        nodes.get(junctionNodeId)!.connections.push({
          toNodeId: axisEndNodeId,
          distance: distanceToEnd,
          type: 'tunnel',
          axisId: axis.id,
        });
        
        // Connect axis endpoints to junction
        nodes.get(axisStartNodeId)!.connections.push({
          toNodeId: junctionNodeId,
          distance: distanceToStart,
          type: 'tunnel',
          axisId: axis.id,
        });
        
        nodes.get(axisEndNodeId)!.connections.push({
          toNodeId: junctionNodeId,
          distance: distanceToEnd,
          type: 'tunnel',
          axisId: axis.id,
        });
      }
    }
  }
  
  // Connect axes to each other at intersections
  for (let i = 0; i < axes.length; i++) {
    for (let j = i + 1; j < axes.length; j++) {
      const axis1 = axes[i];
      const axis2 = axes[j];
      
      // Find intersection points or closest approaches
      const intersection = findAxisIntersection(axis1, axis2);
      if (intersection && intersection.distance <= AXIS_CONNECTION_THRESHOLD) {
        const intersectionNodeId = `intersection_${axis1.id}_${axis2.id}`;
        nodes.set(intersectionNodeId, {
          id: intersectionNodeId,
          type: 'junction',
          coordinates: intersection.point,
          connections: [],
        });
        
        // Connect to both axes
        connectJunctionToAxis(nodes, intersectionNodeId, axis1);
        connectJunctionToAxis(nodes, intersectionNodeId, axis2);
      }
    }
  }
  
  return {
    nodes,
    portals: netherPortals,
    axes,
  };
}

// Find intersection between two axes
function findAxisIntersection(axis1: NetherAxis, axis2: NetherAxis): { point: Coordinate; distance: number } | null {
  // Simplified intersection finding - could be improved with proper line-line intersection
  const midpoint1 = {
    x: (axis1.startCoordinates.x + axis1.endCoordinates.x) / 2,
    y: (axis1.startCoordinates.y + axis1.endCoordinates.y) / 2,
    z: (axis1.startCoordinates.z + axis1.endCoordinates.z) / 2,
  };
  
  const closestPoint = getClosestPointOnAxis(axis2, midpoint1);
  const distance = calculate2DDistance(midpoint1, closestPoint);
  
  if (distance <= AXIS_CONNECTION_THRESHOLD) {
    return { point: closestPoint, distance };
  }
  
  return null;
}

// Connect a junction node to an axis
function connectJunctionToAxis(nodes: Map<string, GraphNode>, junctionId: string, axis: NetherAxis) {
  const junction = nodes.get(junctionId);
  if (!junction) return;
  
  const axisStartId = `axis_${axis.id}_start`;
  const axisEndId = `axis_${axis.id}_end`;
  
  const distanceToStart = calculate2DDistance(junction.coordinates, axis.startCoordinates);
  const distanceToEnd = calculate2DDistance(junction.coordinates, axis.endCoordinates);
  
  // Connect junction to axis endpoints
  junction.connections.push({
    toNodeId: axisStartId,
    distance: distanceToStart,
    type: 'tunnel',
    axisId: axis.id,
  });
  
  junction.connections.push({
    toNodeId: axisEndId,
    distance: distanceToEnd,
    type: 'tunnel',
    axisId: axis.id,
  });
  
  // Connect axis endpoints to junction
  nodes.get(axisStartId)?.connections.push({
    toNodeId: junctionId,
    distance: distanceToStart,
    type: 'tunnel',
    axisId: axis.id,
  });
  
  nodes.get(axisEndId)?.connections.push({
    toNodeId: junctionId,
    distance: distanceToEnd,
    type: 'tunnel',
    axisId: axis.id,
  });
}

// Get the nearest graph node to a coordinate
export function findNearestNode(graph: NetherGraph, coord: Coordinate): GraphNode | null {
  let nearest: GraphNode | null = null;
  let minDistance = Infinity;
  
  for (const node of graph.nodes.values()) {
    const distance = calculate2DDistance(coord, node.coordinates);
    if (distance < minDistance) {
      minDistance = distance;
      nearest = node;
    }
  }
  
  return nearest;
}