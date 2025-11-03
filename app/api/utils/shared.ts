import { promises as fs } from 'fs';
import path from 'path';
import type { TradeItem as PrismaTradeItem, TradeOffer as PrismaTradeOffer } from '@prisma/client';
import { prisma } from '@/lib/prisma';

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
  owners: string[];
  slug?: string;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
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
  negotiable?: boolean;
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
  image?: string | null;
  imageUrl?: string | null;
  tags: string[];
  owners?: string[];
  discord: string | null;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
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

const createNegotiableTradeItem = (): TradeItem => ({
  item_id: '',
  quantity: 0,
  enchanted: false,
  custom_name: null,
});

const toTradeItem = (item?: PrismaTradeItem | null): TradeItem => {
  if (!item) {
    return createNegotiableTradeItem();
  }

  return {
    custom_name: item.customName ?? null,
    item_id: item.itemId,
    quantity: item.quantity,
    enchanted: item.enchanted,
  };
};

const toTradeOffer = (offer: PrismaTradeOffer & { items: PrismaTradeItem[] }): TradeOffer | null => {
  const gives = offer.items.find((item) => item.kind === 'gives');
  if (!gives) {
    return null;
  }

  const wants = offer.items.find((item) => item.kind === 'wants');

  return {
    gives: toTradeItem(gives),
    wants: wants ? toTradeItem(wants) : createNegotiableTradeItem(),
    negotiable: offer.negotiable,
  };
};

export async function loadPortals(): Promise<Portal[]> {
  const portalRecords = await prisma.portal.findMany({
    where: { status: 'approved' },
    orderBy: [{ name: 'asc' }],
  });

  return portalRecords.map((portal): Portal => ({
    id: portal.slug,
    slug: portal.slug,
    name: portal.name,
    world: portal.world,
    coordinates: {
      x: portal.coordX,
      y: portal.coordY,
      z: portal.coordZ,
    },
    description: portal.description ?? null,
    address: portal.address ?? '',
    owners: portal.ownerNames,
    'nether-associate': null,
    createdById: portal.createdById,
    createdAt: portal.createdAt,
    updatedAt: portal.updatedAt,
  }));
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
  const placeRecords = await prisma.place.findMany({
    where: { status: 'approved' },
    include: {
      tradeOffers: {
        include: {
          items: true,
        },
      },
    },
    orderBy: [{ name: 'asc' }],
  });

  return placeRecords.map((place) => {
    const trades = place.tradeOffers
      .map((offer) => toTradeOffer(offer))
      .filter((offer): offer is TradeOffer => offer !== null);

    return {
      id: place.slug,
      name: place.name,
      world: place.world,
      coordinates: {
        x: place.coordX,
        y: place.coordY,
        z: place.coordZ,
      },
      description: place.description ?? null,
      image: place.imageUrl ?? null,
      imageUrl: place.imageUrl ?? null,
      tags: place.tags,
      owners: place.ownerNames ?? [],
      discord: place.discordUrl ?? null,
      trade: trades.length > 0 ? trades : null,
      createdById: place.createdById,
      createdAt: place.createdAt,
      updatedAt: place.updatedAt,
    };
  });
}

export async function loadNetherData(): Promise<NetherData> {
  const netherPath = path.join(process.cwd(), 'public', 'data', 'nether_axes.json');
  const content = await fs.readFile(netherPath, 'utf-8');
  return JSON.parse(content);
}
