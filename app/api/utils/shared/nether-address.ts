import { promises as fs } from 'fs';
import path from 'path';
import { calculateEuclideanDistance } from './spatial';
import type { Coordinates, NetherAddress, NetherData, NetherStop } from './types';

type NearestStopCandidate = {
  axisName: string;
  stop: NetherStop;
  distance: number;
};

const AXIS_DIRECTIONS: Record<string, string> = {
  Nord: 'north',
  Sud: 'south',
  Ouest: 'west',
  Est: 'east',
  'Nord-Ouest': 'northwest',
  'Nord-Est': 'northeast',
  'Sud-Ouest': 'southwest',
  'Sud-Est': 'southeast',
};

const MAIN_AXES = ['Nord', 'Sud', 'Ouest', 'Est'];

const getAxisDirection = (axisName: string) => AXIS_DIRECTIONS[axisName] || 'unknown';

const isMainAxis = (axisName: string) => MAIN_AXES.includes(axisName);

const toStopAddress = (
  axisName: string,
  stop: NetherStop,
  distance: number,
  direction?: string
): NetherAddress => ({
  address: [axisName, stop.level, direction].filter(Boolean).join(' '),
  nearestStop: {
    axis: axisName,
    level: stop.level,
    coordinates: { x: stop.x, y: stop.y, z: stop.z },
    distance,
  },
  ...(direction ? { direction } : {}),
});

const toSpawnAddress = (coordinates: Coordinates, distance: number): NetherAddress => ({
  address: 'Spawn',
  nearestStop: {
    axis: 'Spawn',
    level: null,
    coordinates,
    distance,
  },
});

function findNearestStop(
  targetX: number,
  targetY: number,
  targetZ: number,
  axes: NetherData['axes']
): NearestStopCandidate | null {
  let nearestStop: NearestStopCandidate | null = null;

  Object.entries(axes).forEach(([axisName, stops]) => {
    stops.forEach((stop) => {
      const distance = calculateEuclideanDistance(targetX, targetY, targetZ, stop.x, stop.y, stop.z);
      if (!nearestStop || distance < nearestStop.distance) {
        nearestStop = { axisName, stop, distance };
      }
    });
  });

  return nearestStop;
}

function findSecondNearestAtSameLevel(
  targetX: number,
  targetY: number,
  targetZ: number,
  nearestStop: NetherStop,
  axes: NetherData['axes'],
  excludeAxisName: string
): NearestStopCandidate | null {
  let secondNearest: NearestStopCandidate | null = null;

  Object.entries(axes).forEach(([axisName, stops]) => {
    if (axisName === excludeAxisName) {
      return;
    }

    const stopAtSameLevel = stops.find((stop) => stop.level === nearestStop.level);
    if (!stopAtSameLevel) {
      return;
    }

    const distance = calculateEuclideanDistance(targetX, targetY, targetZ, stopAtSameLevel.x, stopAtSameLevel.y, stopAtSameLevel.z);
    if (!secondNearest || distance < secondNearest.distance) {
      secondNearest = { axisName, stop: stopAtSameLevel, distance };
    }
  });

  return secondNearest;
}

function determineDirection(
  targetX: number,
  targetZ: number,
  mainAxisName: string,
  mainAxisStop: NetherStop,
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

  return mainDirection === 'north' || mainDirection === 'south'
    ? targetX > mainAxisStop.x ? 'droite' : 'gauche'
    : targetZ < mainAxisStop.z ? 'droite' : 'gauche';
}

export async function loadNetherData(): Promise<NetherData> {
  const netherPath = path.join(process.cwd(), 'public', 'data', 'nether_axes.json');
  const content = await fs.readFile(netherPath, 'utf-8');
  return JSON.parse(content);
}

export async function calculateNetherAddress(x: number, y: number, z: number): Promise<NetherAddress> {
  const data = await loadNetherData();
  const nearestStop = findNearestStop(x, y, z, data.axes);

  if (!nearestStop) {
    return { error: 'No nether stops found' };
  }

  const spawnDistance = calculateEuclideanDistance(x, y, z, data.spawn.x, data.spawn.y, data.spawn.z);
  if (spawnDistance < nearestStop.distance) {
    return toSpawnAddress(data.spawn, spawnDistance);
  }

  if (isMainAxis(nearestStop.axisName) && nearestStop.distance > 10) {
    const secondNearest = findSecondNearestAtSameLevel(x, y, z, nearestStop.stop, data.axes, nearestStop.axisName);
    if (secondNearest) {
      const direction = determineDirection(x, z, nearestStop.axisName, nearestStop.stop, secondNearest.axisName);
      return toStopAddress(nearestStop.axisName, nearestStop.stop, nearestStop.distance, direction);
    }
  }

  return toStopAddress(nearestStop.axisName, nearestStop.stop, nearestStop.distance);
}

export async function resolveNetherAddressForWorld(
  world: string,
  coordinates: Coordinates,
  submittedAddress?: string | null
): Promise<string | null> {
  if (world !== 'nether') {
    return null;
  }

  const manualAddress = submittedAddress?.trim();
  if (manualAddress) {
    return manualAddress;
  }

  const netherAddress = await calculateNetherAddress(coordinates.x, coordinates.y, coordinates.z);
  return netherAddress.address ?? null;
}
