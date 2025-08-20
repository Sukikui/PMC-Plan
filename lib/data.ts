import { promises as fs } from 'fs';
import path from 'path';
import { Portal, Place, NetherAxis, PortalSchema, PlaceSchema, NetherAxisSchema } from './schemas';

// Cache to avoid reloading files
const cache = new Map<string, any>();

export async function getPortals(): Promise<Portal[]> {
  const cacheKey = 'portals';
  
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }

  const portalsDir = path.join(process.cwd(), 'public', 'data', 'portals');
  
  try {
    const files = await fs.readdir(portalsDir);
    const jsonFiles = files.filter(file => file.endsWith('.json'));
    
    const portals: Portal[] = [];
    
    for (const file of jsonFiles) {
      try {
        const filePath = path.join(portalsDir, file);
        const content = await fs.readFile(filePath, 'utf-8');
        const data = JSON.parse(content);
        const portal = PortalSchema.parse(data);
        portals.push(portal);
      } catch (error) {
        console.warn(`Failed to load portal file ${file}:`, error);
      }
    }
    
    cache.set(cacheKey, portals);
    return portals;
  } catch (error) {
    console.warn('Failed to load portals directory:', error);
    return [];
  }
}

export async function getPlaces(): Promise<Place[]> {
  const cacheKey = 'places';
  
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }

  const placesDir = path.join(process.cwd(), 'public', 'data', 'places');
  
  try {
    const files = await fs.readdir(placesDir);
    const jsonFiles = files.filter(file => file.endsWith('.json'));
    
    const places: Place[] = [];
    
    for (const file of jsonFiles) {
      try {
        const filePath = path.join(placesDir, file);
        const content = await fs.readFile(filePath, 'utf-8');
        const data = JSON.parse(content);
        const place = PlaceSchema.parse(data);
        places.push(place);
      } catch (error) {
        console.warn(`Failed to load place file ${file}:`, error);
      }
    }
    
    cache.set(cacheKey, places);
    return places;
  } catch (error) {
    console.warn('Failed to load places directory:', error);
    return [];
  }
}

export async function getNetherAxes(): Promise<NetherAxis[]> {
  const cacheKey = 'nether_axes';
  
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }

  const axesFile = path.join(process.cwd(), 'public', 'data', 'nether_axes.json');
  
  try {
    const content = await fs.readFile(axesFile, 'utf-8');
    const data = JSON.parse(content);
    
    const axes = data.axes.map((axis: any) => NetherAxisSchema.parse(axis));
    
    cache.set(cacheKey, axes);
    return axes;
  } catch (error) {
    console.warn('Failed to load nether axes:', error);
    return [];
  }
}

export async function getPortalById(id: string): Promise<Portal | null> {
  const portals = await getPortals();
  return portals.find(portal => portal.id === id) || null;
}

export async function getPlaceById(id: string): Promise<Place | null> {
  const places = await getPlaces();
  return places.find(place => place.id === id) || null;
}

export async function getAxisById(id: string): Promise<NetherAxis | null> {
  const axes = await getNetherAxes();
  return axes.find(axis => axis.id === id) || null;
}

// Clear cache (useful for development or data updates)
export function clearCache(): void {
  cache.clear();
}

// Get places by tag
export async function getPlacesByTag(tag: string): Promise<Place[]> {
  const places = await getPlaces();
  return places.filter(place => place.tags.includes(tag));
}

// Get portals by dimension
export async function getPortalsByDimension(dimension: 'overworld' | 'nether' | 'end'): Promise<Portal[]> {
  const portals = await getPortals();
  return portals.filter(portal => portal.dimension === dimension);
}