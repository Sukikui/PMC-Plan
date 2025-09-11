import { promises as fs } from 'fs';
import path from 'path';

export interface Portal {
  id: string;
  name: string;
  world: string;
  coordinates: {
    x: number;
    y: number;
    z: number;
  };
  description: string | null;
  address: string;
  "nether-associate": {
    coordinates: {
        x: number;
        y: number;
        z: number;
    },
    address: string;
    description: string | null;
  } | null;
}

export interface PortalWithDistance extends Portal {
  distance: number;
}

export interface TradeItem {
  custom_name?: string | null;
  item_id: string;
  quantity: number;
  enchanted: boolean;
  lore?: string[];
}

export interface TradeOffer {
  gives: TradeItem;
  wants: TradeItem;
  stock?: number | null;
  active?: boolean;
}

export interface Place {
  id: string;
  name: string;
  world: string;
  coordinates: {
    x: number;
    y: number;
    z: number;
  };
  description: string | null;
  tags: string[];
  owner: string | null;
  discord: string | null;
  trade: TradeOffer[] | null;
}

export interface NetherAddress {
  address?: string;
  nearestStop?: {
    axis: string;
    level: number | null;
    coordinates: {
      x: number;
      y: number;
      z: number;
    };
    distance: number;
  };
  direction?: string;
  error?: string;
}

export interface NetherStop {
  level: number;
  x: number;
  y: number;
  z: number;
}

export interface NetherData {
  spawn: {
    x: number;
    y: number;
    z: number;
  };
  axes: {
    [key: string]: NetherStop[];
  };
}

export function calculateEuclideanDistance(
  x1: number, y1: number, z1: number,
  x2: number, y2: number, z2: number
): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dz = z2 - z1;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

export function convertOverworldToNether(x: number, z: number): { x: number; z: number } {
  return {
    x: Math.floor(x / 8),
    z: Math.floor(z / 8)
  };
}

export function convertNetherToOverworld(x: number, z: number): { x: number; z: number } {
  return {
    x: x * 8,
    z: z * 8
  };
}

export async function loadPortals(): Promise<Portal[]> {
  const portalsDir = path.join(process.cwd(), 'public', 'data', 'portals');
  
  try {
    const files = await fs.readdir(portalsDir);
    const jsonFiles = files.filter(file => file.endsWith('.json'));
    
    const portals: Portal[] = [];
    
    for (const file of jsonFiles) {
      try {
        const filePath = path.join(portalsDir, file);
        const content = await fs.readFile(filePath, 'utf-8');
        const portalData = JSON.parse(content);
        
        // Ensure all required fields are present with proper null handling
        const portal: Portal = {
          id: portalData.id || '',
          name: portalData.name || '',
          world: portalData.world || 'overworld',
          coordinates: portalData.coordinates || { x: 0, y: 0, z: 0 },
          description: portalData.description || null,
          address: portalData.address || '',
          "nether-associate": portalData["nether-associate"] || null
        };
        
        // If it's a Nether portal, calculate and add its address
        if (portal.world === 'nether') {
          const netherAddress = await calculateNetherAddress(portal.coordinates.x, portal.coordinates.y, portal.coordinates.z);
          if (!netherAddress.address) {
            throw new Error(`Failed to calculate nether address for portal ${portal.id} at coordinates (${portal.coordinates.x}, ${portal.coordinates.y}, ${portal.coordinates.z})`);
          }
          portal.address = netherAddress.address;
        }
        portals.push(portal);
      } catch (error) {
        console.warn(`Failed to load portal file ${file}:`, error);
      }
    }
    
    return portals;
  } catch (error) {
    console.warn('Failed to load portals directory:', error);
    return [];
  }
}

export async function findNearestPortals(
    x: number,
    y: number,
    z: number,
    world: 'overworld' | 'nether' = 'overworld',
    allPortals: Portal[],
    max_distance?: number
  ): Promise<PortalWithDistance[]> {
    const worldPortals = allPortals.filter(portal => portal.world === world);
  
    if (worldPortals.length === 0) {
      return [];
    }
  
    const portalsWithDistance: PortalWithDistance[] = worldPortals
      .map(portal => ({
        ...portal,
        distance: calculateEuclideanDistance(
          x, y, z,
          portal.coordinates.x, portal.coordinates.y, portal.coordinates.z
        )
      }))
      .sort((a, b) => a.distance - b.distance);
  
    return max_distance
      ? portalsWithDistance.filter(portal => portal.distance <= max_distance)
      : portalsWithDistance;
}

function getAxisDirection(axisName: string): string {
    const directions: { [key: string]: string } = {
      'Nord': 'north', 'Sud': 'south', 'Ouest': 'west', 'Est': 'east',
      'Nord-Ouest': 'northwest', 'Nord-Est': 'northeast',
      'Sud-Ouest': 'southwest', 'Sud-Est': 'southeast'
    };
    return directions[axisName] || 'unknown';
}
  
function isMainAxis(axisName: string): boolean {
    return ['Nord', 'Sud', 'Ouest', 'Est'].includes(axisName);
}
  
function findSecondNearestAtSameLevel(
    targetX: number, targetY: number, targetZ: number,
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
          secondNearest = { axisName, stop: stopAtSameLevel, distance };
        }
      }
    });
    
    return secondNearest;
}
  
function determineDirection(
    targetX: number, targetZ: number,
    mainAxisName: string, mainAxisStop: NetherStop,
    secondAxisName: string
): string {
    const mainDirection = getAxisDirection(mainAxisName);
    const secondDirection = getAxisDirection(secondAxisName);
    
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
    
    if (mainDirection === 'north' || mainDirection === 'south') {
      return targetX > mainAxisStop.x ? 'droite' : 'gauche';
    } else {
      return targetZ < mainAxisStop.z ? 'droite' : 'gauche';
    }
}

export async function calculateNetherAddress(x: number, y: number, z: number): Promise<NetherAddress> {
    const data = await loadNetherData();
    let nearestStop: { axisName: string; stop: NetherStop; distance: number } | null = null;
  
    Object.entries(data.axes).forEach(([axisName, stops]) => {
      stops.forEach(stop => {
        const distance = calculateEuclideanDistance(x, y, z, stop.x, stop.y, stop.z);
        if (!nearestStop || distance < nearestStop.distance) {
          nearestStop = { axisName, stop, distance };
        }
      });
    });
  
    if (!nearestStop) {
      return { error: 'No nether stops found' };
    }
  
    // TypeScript assertion: nearestStop is guaranteed to be non-null here
    const selectedStop = nearestStop as { axisName: string; stop: NetherStop; distance: number };
    
    const spawnDistance = calculateEuclideanDistance(x, y, z, data.spawn.x, data.spawn.y, data.spawn.z);
    if (spawnDistance < selectedStop.distance) {
      return {
        address: "Spawn",
        nearestStop: {
          axis: "Spawn",
          level: null,
          coordinates: { x: data.spawn.x, y: data.spawn.y, z: data.spawn.z },
          distance: spawnDistance
        }
      };
    }
  
    if (isMainAxis(selectedStop.axisName) && selectedStop.distance > 10) {
      const secondNearest = findSecondNearestAtSameLevel(x, y, z, selectedStop.stop, data.axes, selectedStop.axisName);
      if (secondNearest) {
        const direction = determineDirection(x, z, selectedStop.axisName, selectedStop.stop, secondNearest.axisName);
        return {
          address: `${selectedStop.axisName} ${selectedStop.stop.level} ${direction}`,
          nearestStop: {
            axis: selectedStop.axisName,
            level: selectedStop.stop.level,
            coordinates: { x: selectedStop.stop.x, y: selectedStop.stop.y, z: selectedStop.stop.z },
            distance: selectedStop.distance
          },
          direction
        };
      }
    }
  
    return {
      address: `${selectedStop.axisName} ${selectedStop.stop.level}`,
      nearestStop: {
        axis: selectedStop.axisName,
        level: selectedStop.stop.level,
        coordinates: { x: selectedStop.stop.x, y: selectedStop.stop.y, z: selectedStop.stop.z },
        distance: selectedStop.distance
      }
    };
}

export async function loadPlaces(): Promise<Place[]> {
  const placesDir = path.join(process.cwd(), 'public', 'data', 'places');
  
  try {
    const files = await fs.readdir(placesDir);
    const jsonFiles = files.filter(file => file.endsWith('.json'));
    
    const places: Place[] = [];
    
    for (const file of jsonFiles) {
      try {
        const filePath = path.join(placesDir, file);
        const content = await fs.readFile(filePath, 'utf-8');
        const placeData = JSON.parse(content);
        
        // Ensure all required fields are present with proper null handling
        const place: Place = {
          id: placeData.id || '',
          name: placeData.name || '',
          world: placeData.world || 'overworld',
          coordinates: placeData.coordinates || { x: 0, y: 0, z: 0 },
          description: placeData.description || null,
          tags: placeData.tags || [],
          owner: placeData.owner || null,
          discord: placeData.discord || null,
          trade: placeData.trade || null
        };
        
        places.push(place);
      } catch (error) {
        console.warn(`Failed to load place file ${file}:`, error);
      }
    }
    
    return places;
  } catch (error) {
    console.warn('Failed to load places directory:', error);
    return [];
  }
}

export async function loadNetherData(): Promise<NetherData> {
  const netherPath = path.join(process.cwd(), 'public', 'data', 'nether_axes.json');
  const content = await fs.readFile(netherPath, 'utf-8');
  return JSON.parse(content);
}
