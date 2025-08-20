import { Coordinate, Dimension, Path, PathSegment, Portal, Place } from './schemas';
import { getPortals, getPlaces, getNetherAxes, getPlaceById } from './data';
import { linkPortals, getLinkedPortal } from './portals_linking';
import { buildNetherGraph, NetherGraph, GraphNode } from './nether_graph';
import { calculate2DDistance, calculateManhattanDistance, overworldToNether, netherToOverworld } from './coords';

interface PriorityQueueItem {
  node: GraphNode;
  gCost: number;
  fCost: number;
  parent: GraphNode | null;
}

class PriorityQueue {
  private items: PriorityQueueItem[] = [];
  
  enqueue(item: PriorityQueueItem) {
    this.items.push(item);
    this.items.sort((a, b) => a.fCost - b.fCost);
  }
  
  dequeue(): PriorityQueueItem | null {
    return this.items.shift() || null;
  }
  
  isEmpty(): boolean {
    return this.items.length === 0;
  }
  
  contains(nodeId: string): boolean {
    return this.items.some(item => item.node.id === nodeId);
  }
  
  updatePriority(nodeId: string, newGCost: number, newFCost: number, newParent: GraphNode | null) {
    const index = this.items.findIndex(item => item.node.id === nodeId);
    if (index !== -1) {
      this.items[index].gCost = newGCost;
      this.items[index].fCost = newFCost;
      this.items[index].parent = newParent;
      this.items.sort((a, b) => a.fCost - b.fCost);
    }
  }
}

interface PathfindingState {
  startPos: { dim: Dimension; x: number; y: number; z: number };
  targetPlace: Place;
  portals: Portal[];
  portalLinks: any[];
  netherGraph: NetherGraph;
}

export async function findPath(
  startPos: { dim: Dimension; x: number; y: number; z: number },
  targetPlaceId: string
): Promise<Path | null> {
  // Load all necessary data
  const [targetPlace, portals, netherAxes] = await Promise.all([
    getPlaceById(targetPlaceId),
    getPortals(),
    getNetherAxes(),
  ]);
  
  if (!targetPlace) {
    throw new Error(`Place with ID ${targetPlaceId} not found`);
  }
  
  const portalLinks = linkPortals(portals);
  const netherGraph = buildNetherGraph(portals, netherAxes);
  
  const state: PathfindingState = {
    startPos,
    targetPlace,
    portals,
    portalLinks,
    netherGraph,
  };
  
  // If both start and target are in the same dimension, use direct pathfinding
  if (startPos.dim === targetPlace.world) {
    return findDirectPath(state);
  }
  
  // If different dimensions, use inter-dimensional pathfinding
  return findInterDimensionalPath(state);
}

// Find direct path within the same dimension
function findDirectPath(state: PathfindingState): Path | null {
  const { startPos, targetPlace } = state;
  
  if (startPos.dim === 'nether') {
    // Use nether graph for pathfinding
    return findNetherPath(state);
  }
  
  // For overworld or end, use simple direct path
  const segments: PathSegment[] = [{
    type: 'walk',
    dimension: startPos.dim,
    coordinates: { x: targetPlace.coordinates.x, y: targetPlace.coordinates.y, z: targetPlace.coordinates.z },
    distance: calculate2DDistance(
      { x: startPos.x, y: startPos.y, z: startPos.z },
      targetPlace.coordinates
    ),
    instructions: `Walk directly to ${targetPlace.name}`,
  }];
  
  return {
    segments,
    totalDistance: segments[0].distance,
    startCoordinates: { x: startPos.x, y: startPos.y, z: startPos.z },
    endCoordinates: targetPlace.coordinates,
  };
}

// Find path using nether graph (A* algorithm)
function findNetherPath(state: PathfindingState): Path | null {
  const { startPos, targetPlace, netherGraph } = state;
  
  // Find nearest nodes to start and end positions
  const startNode = findNearestGraphNode(netherGraph, { x: startPos.x, y: startPos.y, z: startPos.z });
  const endNode = findNearestGraphNode(netherGraph, targetPlace.coordinates);
  
  if (!startNode || !endNode) {
    return null;
  }
  
  // A* pathfinding
  const openSet = new PriorityQueue();
  const closedSet = new Set<string>();
  const gCosts = new Map<string, number>();
  const parents = new Map<string, GraphNode | null>();
  
  const startGCost = calculate2DDistance({ x: startPos.x, y: startPos.y, z: startPos.z }, startNode.coordinates);
  const startHCost = calculateManhattanDistance(startNode.coordinates, targetPlace.coordinates);
  
  openSet.enqueue({
    node: startNode,
    gCost: startGCost,
    fCost: startGCost + startHCost,
    parent: null,
  });
  
  gCosts.set(startNode.id, startGCost);
  parents.set(startNode.id, null);
  
  while (!openSet.isEmpty()) {
    const current = openSet.dequeue()!;
    
    if (closedSet.has(current.node.id)) continue;
    closedSet.add(current.node.id);
    
    // Check if we reached the end
    if (current.node.id === endNode.id) {
      // Reconstruct path
      const pathNodes = reconstructPath(parents, current.node);
      return buildPathFromNodes(state, pathNodes, startPos, targetPlace);
    }
    
    // Explore neighbors
    for (const connection of current.node.connections) {
      const neighbor = netherGraph.nodes.get(connection.toNodeId);
      if (!neighbor || closedSet.has(neighbor.id)) continue;
      
      const tentativeGCost = (gCosts.get(current.node.id) || 0) + connection.distance;
      
      if (!gCosts.has(neighbor.id) || tentativeGCost < gCosts.get(neighbor.id)!) {
        const hCost = calculateManhattanDistance(neighbor.coordinates, targetPlace.coordinates);
        const fCost = tentativeGCost + hCost;
        
        gCosts.set(neighbor.id, tentativeGCost);
        parents.set(neighbor.id, current.node);
        
        if (openSet.contains(neighbor.id)) {
          openSet.updatePriority(neighbor.id, tentativeGCost, fCost, current.node);
        } else {
          openSet.enqueue({
            node: neighbor,
            gCost: tentativeGCost,
            fCost,
            parent: current.node,
          });
        }
      }
    }
  }
  
  return null; // No path found
}

// Find inter-dimensional path (overworld <-> nether)
function findInterDimensionalPath(state: PathfindingState): Path | null {
  const { startPos, targetPlace, portalLinks } = state;
  
  // Strategy: Find best portal combination to minimize total travel distance
  let bestPath: Path | null = null;
  let bestDistance = Infinity;
  
  // Try different portal combinations
  for (const link of portalLinks) {
    const owPortal = link.overworldPortal;
    const netherPortal = link.netherPortal;
    
    let path: PathSegment[] = [];
    let totalDistance = 0;
    
    if (startPos.dim === 'overworld' && targetPlace.world === 'nether') {
      // Overworld -> Portal -> Nether
      const distanceToPortal = calculate2DDistance(
        { x: startPos.x, y: startPos.y, z: startPos.z },
        owPortal.coordinates
      );
      const distanceFromPortal = calculate2DDistance(
        netherPortal.coordinates,
        targetPlace.coordinates
      );
      
      path = [
        {
          type: 'walk',
          dimension: 'overworld',
          coordinates: owPortal.coordinates,
          distance: distanceToPortal,
          instructions: `Walk to portal ${owPortal.name}`,
          portalId: owPortal.id,
        },
        {
          type: 'portal',
          dimension: 'nether',
          coordinates: netherPortal.coordinates,
          distance: 0,
          instructions: `Use portal to enter Nether`,
          portalId: netherPortal.id,
        },
        {
          type: 'walk',
          dimension: 'nether',
          coordinates: targetPlace.coordinates,
          distance: distanceFromPortal,
          instructions: `Walk to ${targetPlace.name}`,
        },
      ];
      
      totalDistance = distanceToPortal + distanceFromPortal;
      
    } else if (startPos.dim === 'nether' && targetPlace.world === 'overworld') {
      // Nether -> Portal -> Overworld
      const distanceToPortal = calculate2DDistance(
        { x: startPos.x, y: startPos.y, z: startPos.z },
        netherPortal.coordinates
      );
      const distanceFromPortal = calculate2DDistance(
        owPortal.coordinates,
        targetPlace.coordinates
      );
      
      path = [
        {
          type: 'walk',
          dimension: 'nether',
          coordinates: netherPortal.coordinates,
          distance: distanceToPortal,
          instructions: `Walk to portal ${netherPortal.name}`,
          portalId: netherPortal.id,
        },
        {
          type: 'portal',
          dimension: 'overworld',
          coordinates: owPortal.coordinates,
          distance: 0,
          instructions: `Use portal to enter Overworld`,
          portalId: owPortal.id,
        },
        {
          type: 'walk',
          dimension: 'overworld',
          coordinates: targetPlace.coordinates,
          distance: distanceFromPortal,
          instructions: `Walk to ${targetPlace.name}`,
        },
      ];
      
      totalDistance = distanceToPortal + distanceFromPortal;
    }
    
    if (totalDistance < bestDistance) {
      bestDistance = totalDistance;
      bestPath = {
        segments: path,
        totalDistance,
        startCoordinates: { x: startPos.x, y: startPos.y, z: startPos.z },
        endCoordinates: targetPlace.coordinates,
      };
    }
  }
  
  return bestPath;
}

// Helper functions
function findNearestGraphNode(graph: NetherGraph, coord: Coordinate): GraphNode | null {
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

function reconstructPath(parents: Map<string, GraphNode | null>, endNode: GraphNode): GraphNode[] {
  const path: GraphNode[] = [];
  let current: GraphNode | null = endNode;
  
  while (current) {
    path.unshift(current);
    current = parents.get(current.id) || null;
  }
  
  return path;
}

function buildPathFromNodes(
  state: PathfindingState,
  pathNodes: GraphNode[],
  startPos: { dim: Dimension; x: number; y: number; z: number },
  targetPlace: Place
): Path {
  const segments: PathSegment[] = [];
  let totalDistance = 0;
  
  // Add initial walk to first node if necessary
  if (pathNodes.length > 0) {
    const firstNode = pathNodes[0];
    const distanceToFirst = calculate2DDistance(
      { x: startPos.x, y: startPos.y, z: startPos.z },
      firstNode.coordinates
    );
    
    if (distanceToFirst > 0) {
      segments.push({
        type: 'walk',
        dimension: startPos.dim,
        coordinates: firstNode.coordinates,
        distance: distanceToFirst,
        instructions: `Walk to ${firstNode.type}`,
      });
      totalDistance += distanceToFirst;
    }
  }
  
  // Add segments between nodes
  for (let i = 0; i < pathNodes.length - 1; i++) {
    const current = pathNodes[i];
    const next = pathNodes[i + 1];
    const connection = current.connections.find(c => c.toNodeId === next.id);
    
    if (connection) {
      segments.push({
        type: connection.type === 'tunnel' ? 'axis' : 'walk',
        dimension: startPos.dim,
        coordinates: next.coordinates,
        distance: connection.distance,
        instructions: connection.type === 'tunnel' 
          ? `Follow tunnel along axis`
          : `Walk to ${next.type}`,
        axisId: connection.axisId,
      });
      totalDistance += connection.distance;
    }
  }
  
  // Add final walk to target
  if (pathNodes.length > 0) {
    const lastNode = pathNodes[pathNodes.length - 1];
    const finalDistance = calculate2DDistance(lastNode.coordinates, targetPlace.coordinates);
    
    if (finalDistance > 0) {
      segments.push({
        type: 'walk',
        dimension: targetPlace.world,
        coordinates: targetPlace.coordinates,
        distance: finalDistance,
        instructions: `Walk to ${targetPlace.name}`,
      });
      totalDistance += finalDistance;
    }
  }
  
  return {
    segments,
    totalDistance,
    startCoordinates: { x: startPos.x, y: startPos.y, z: startPos.z },
    endCoordinates: targetPlace.coordinates,
  };
}