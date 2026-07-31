import {
  netherAxisPolylines,
  type NetherAxisPoint,
} from './network-data';

interface NetworkEdge {
  id: string;
  from: NetherAxisPoint;
  to: NetherAxisPoint;
}

interface EdgeProjection {
  edge: NetworkEdge;
  point: NetherAxisPoint;
  ratio: number;
}

interface GraphEdge {
  to: string;
  distance: number;
}

interface SplitPoint {
  id: string;
  point: NetherAxisPoint;
  ratio: number;
}

export interface NetherRoute {
  distance: number;
  path: NetherAxisPoint[];
  usesAxes: boolean;
}

const EPSILON = 1e-9;
const START_NODE_ID = 'route-start';
const END_NODE_ID = 'route-end';
const ENTRY_NODE_ID = 'route-entry';
const EXIT_NODE_ID = 'route-exit';

const networkEdges: NetworkEdge[] = netherAxisPolylines.flatMap((polyline) => (
  polyline.points.slice(1).map((point, index) => ({
    id: `${polyline.id}-${index}`,
    from: polyline.points[index],
    to: point,
  }))
));

export const calculateNetherRoute = (
  from: NetherAxisPoint,
  to: NetherAxisPoint
): NetherRoute => {
  const directDistance = distanceBetween(from, to);
  const directRoute = { distance: directDistance, path: [from, to], usesAxes: false };
  if (directDistance <= EPSILON || networkEdges.length === 0) return directRoute;

  const entry = findNearestProjection(from);
  const exit = findNearestProjection(to);
  if (!entry || !exit) return directRoute;

  const graph = buildRouteGraph(from, to, entry, exit);
  const result = findShortestPath(graph.edges, START_NODE_ID, END_NODE_ID);
  if (!result || directDistance * 2 <= result.distance) return directRoute;

  return {
    distance: result.distance,
    path: deduplicatePoints(result.nodeIds.map((nodeId) => graph.points.get(nodeId)!)),
    usesAxes: true,
  };
};

const buildRouteGraph = (
  from: NetherAxisPoint,
  to: NetherAxisPoint,
  entry: EdgeProjection,
  exit: EdgeProjection
) => {
  const edges = new Map<string, GraphEdge[]>();
  const points = new Map<string, NetherAxisPoint>();
  const splitEdges = new Map<string, SplitPoint[]>();
  const entryNodeId = getProjectionNodeId(entry, ENTRY_NODE_ID);
  const exitNodeId = projectionsCoincide(entry, exit)
    ? entryNodeId
    : getProjectionNodeId(exit, EXIT_NODE_ID);

  networkEdges.forEach((edge) => {
    const fromId = getPointId(edge.from);
    const toId = getPointId(edge.to);
    points.set(fromId, edge.from);
    points.set(toId, edge.to);

    if (edge.id !== entry.edge.id && edge.id !== exit.edge.id) {
      connect(edges, fromId, toId, distanceBetween(edge.from, edge.to));
    }
  });

  addSplitPoint(splitEdges, entry.edge, entryNodeId, entry.point, entry.ratio);
  addSplitPoint(splitEdges, exit.edge, exitNodeId, exit.point, exit.ratio);

  splitEdges.forEach((routePoints, edgeId) => {
    const edge = networkEdges.find((candidate) => candidate.id === edgeId)!;
    const ordered = mergeCoincidentSplitPoints([
      { id: getPointId(edge.from), point: edge.from, ratio: 0 },
      ...routePoints,
      { id: getPointId(edge.to), point: edge.to, ratio: 1 },
    ]);

    ordered.forEach(({ id, point }) => points.set(id, point));
    ordered.slice(1).forEach((point, index) => {
      const previous = ordered[index];
      connect(edges, previous.id, point.id, distanceBetween(previous.point, point.point));
    });
  });

  points.set(START_NODE_ID, from);
  points.set(END_NODE_ID, to);
  connect(edges, START_NODE_ID, entryNodeId, distanceBetween(from, entry.point));
  connect(edges, exitNodeId, END_NODE_ID, distanceBetween(exit.point, to));

  return { edges, points };
};

const addSplitPoint = (
  splitEdges: Map<string, SplitPoint[]>,
  edge: NetworkEdge,
  id: string,
  point: NetherAxisPoint,
  ratio: number
) => {
  const splitPoints = splitEdges.get(edge.id) ?? [];
  splitPoints.push({ id, point, ratio });
  splitEdges.set(edge.id, splitPoints);
};

const mergeCoincidentSplitPoints = (points: SplitPoint[]) => {
  const ordered = [...points].sort((first, second) => first.ratio - second.ratio);
  return ordered.filter((point, index) => (
    index === 0 || Math.abs(point.ratio - ordered[index - 1].ratio) > EPSILON
  ));
};

const findNearestProjection = (point: NetherAxisPoint): EdgeProjection | null => {
  let nearest: (EdgeProjection & { distance: number }) | null = null;

  networkEdges.forEach((edge) => {
    const projection = projectOnEdge(point, edge);
    const distance = distanceBetween(point, projection.point);
    if (!nearest || distance < nearest.distance) nearest = { ...projection, distance };
  });

  return nearest;
};

const projectOnEdge = (point: NetherAxisPoint, edge: NetworkEdge): EdgeProjection => {
  const direction = subtract(edge.to, edge.from);
  const lengthSquared = dot(direction, direction);
  const ratio = lengthSquared <= EPSILON
    ? 0
    : clamp(dot(subtract(point, edge.from), direction) / lengthSquared, 0, 1);

  return {
    edge,
    ratio,
    point: {
      x: edge.from.x + direction.x * ratio,
      y: edge.from.y + direction.y * ratio,
      z: edge.from.z + direction.z * ratio,
    },
  };
};

const findShortestPath = (
  graph: Map<string, GraphEdge[]>,
  startId: string,
  endId: string
) => {
  const distances = new Map<string, number>([[startId, 0]]);
  const previous = new Map<string, string>();
  const unvisited = new Set([...Array.from(graph.keys()), startId, endId]);

  while (unvisited.size > 0) {
    const current = Array.from(unvisited).reduce<string | null>((nearest, nodeId) => (
      nearest === null || getDistance(distances, nodeId) < getDistance(distances, nearest)
        ? nodeId
        : nearest
    ), null);

    if (!current || getDistance(distances, current) === Infinity) break;
    unvisited.delete(current);
    if (current === endId) break;

    (graph.get(current) ?? []).forEach((edge) => {
      if (!unvisited.has(edge.to)) return;
      const candidate = getDistance(distances, current) + edge.distance;
      if (candidate < getDistance(distances, edge.to)) {
        distances.set(edge.to, candidate);
        previous.set(edge.to, current);
      }
    });
  }

  const distance = getDistance(distances, endId);
  if (!Number.isFinite(distance)) return null;

  const nodeIds = [endId];
  while (nodeIds[0] !== startId) {
    const parent = previous.get(nodeIds[0]);
    if (!parent) return null;
    nodeIds.unshift(parent);
  }

  return { distance, nodeIds };
};

const connect = (graph: Map<string, GraphEdge[]>, from: string, to: string, distance: number) => {
  graph.set(from, [...(graph.get(from) ?? []), { to, distance }]);
  graph.set(to, [...(graph.get(to) ?? []), { to: from, distance }]);
};

const getPointId = ({ x, y, z }: NetherAxisPoint) => `point-${x}-${y}-${z}`;
const getProjectionNodeId = (projection: EdgeProjection, fallbackId: string) => {
  if (projection.ratio <= EPSILON) return getPointId(projection.edge.from);
  if (projection.ratio >= 1 - EPSILON) return getPointId(projection.edge.to);
  return fallbackId;
};
const projectionsCoincide = (first: EdgeProjection, second: EdgeProjection) => (
  first.edge.id === second.edge.id && Math.abs(first.ratio - second.ratio) <= EPSILON
);
const getDistance = (distances: Map<string, number>, nodeId: string) => distances.get(nodeId) ?? Infinity;
const clamp = (value: number, minimum: number, maximum: number) => Math.min(maximum, Math.max(minimum, value));
const dot = (first: NetherAxisPoint, second: NetherAxisPoint) => first.x * second.x + first.y * second.y + first.z * second.z;
const subtract = (first: NetherAxisPoint, second: NetherAxisPoint): NetherAxisPoint => ({
  x: first.x - second.x,
  y: first.y - second.y,
  z: first.z - second.z,
});
const distanceBetween = (first: NetherAxisPoint, second: NetherAxisPoint) => Math.hypot(
  first.x - second.x,
  first.y - second.y,
  first.z - second.z
);
const deduplicatePoints = (points: NetherAxisPoint[]) => points.filter((point, index) => (
  index === 0 || distanceBetween(point, points[index - 1]) > EPSILON
));
