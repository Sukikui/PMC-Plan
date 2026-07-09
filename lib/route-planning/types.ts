export interface RouteCoordinates {
  x: number;
  y: number;
  z: number;
}

export interface RouteLocation {
  id?: string;
  name?: string;
  coordinates?: RouteCoordinates;
  world?: string;
  address?: string;
}

export interface RouteStep {
  type: 'overworld_transport' | 'nether_transport' | 'portal';
  distance?: number;
  from: RouteLocation;
  to: RouteLocation;
}

export interface RouteData {
  player_from: {
    coordinates: RouteCoordinates;
    world: string;
  };
  total_distance: number;
  steps: RouteStep[];
}

export interface RouteWorldCoordinates {
  world: string;
  coordinates: RouteCoordinates;
}

export interface RouteBreadcrumbItem {
  key: string;
  location: RouteLocation;
  label: string;
  coordinates?: RouteCoordinates;
  world?: string;
  coordinateItems?: RouteWorldCoordinates[];
  address?: string;
  distanceFromPrevious?: number;
  stepType?: RouteStep['type'];
  kind: 'start' | 'waypoint' | 'destination' | 'unknown';
}

export interface PlayerRoutePosition extends RouteCoordinates {
  world: string;
}

export interface ManualRouteCoordinates {
  x: string;
  y: string;
  z: string;
  world: 'overworld' | 'nether';
}
