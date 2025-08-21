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
  description?: string;
}

export interface PortalWithDistance extends Portal {
  distance: number;
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
  description?: string;
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
        const portal: Portal = JSON.parse(content);
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
        const place: Place = JSON.parse(content);
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