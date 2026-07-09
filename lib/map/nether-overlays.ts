import netherAxesData from '@/public/data/nether_axes.json';
import type { MapLineOverlay } from '@/lib/map/overlays';

type NetherAxisPoint = {
  level?: number;
  x: number;
  z: number;
};

type NetherAxesData = {
  spawn: NetherAxisPoint;
  axes: Record<string, NetherAxisPoint[]>;
};

export const NETHER_AXIS_LINE_WIDTH_BLOCKS = 8;

const data = netherAxesData as NetherAxesData;
const ringAxisOrder = ['Nord', 'Nord-Est', 'Est', 'Sud-Est', 'Sud', 'Sud-Ouest', 'Ouest', 'Nord-Ouest'];

const radialLineOverlays: Array<Omit<MapLineOverlay, 'strokeStyle'>> = Object.entries(data.axes)
  .map(([axisName, stops]) => ({
    id: `nether-axis-${axisName}`,
    points: [data.spawn, ...stops].map(({ x, z }) => ({ x, z })),
    widthBlocks: NETHER_AXIS_LINE_WIDTH_BLOCKS,
  }));

const ringLineOverlays: Array<Omit<MapLineOverlay, 'strokeStyle'>> = Array.from(
  new Set(
    Object.values(data.axes)
      .flatMap((stops) => stops.map((stop) => stop.level))
      .filter((level): level is number => typeof level === 'number')
  )
)
  .sort((a, b) => a - b)
  .map((level) => {
    const points = ringAxisOrder
      .map((axisName) => data.axes[axisName]?.find((stop) => stop.level === level))
      .filter((point): point is NetherAxisPoint => Boolean(point))
      .map(({ x, z }) => ({ x, z }));

    return {
      id: `nether-ring-level-${level}`,
      points: points.length > 2 ? [...points, points[0]] : points,
      widthBlocks: NETHER_AXIS_LINE_WIDTH_BLOCKS,
    };
  })
  .filter((overlay) => overlay.points.length > 1);

export const netherAxisLineOverlays: Array<Omit<MapLineOverlay, 'strokeStyle'>> = [
  ...radialLineOverlays,
  ...ringLineOverlays,
];
