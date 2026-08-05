import { z } from 'zod';
import rawNetherAxesData from '@/public/data/nether_axes.json';

const axisPointSchema = z.object({
  x: z.number(),
  y: z.number(),
  z: z.number(),
});

const axisStopSchema = axisPointSchema.extend({
  level: z.number().int().positive(),
});

export const NETHER_AXIS_ORDER = [
  'Nord',
  'Nord-Est',
  'Est',
  'Sud-Est',
  'Sud',
  'Sud-Ouest',
  'Ouest',
  'Nord-Ouest',
] as const;

const netherAxesSchema = z.object({
  spawn: axisPointSchema,
  axes: z.object(Object.fromEntries(
    NETHER_AXIS_ORDER.map((axisName) => [axisName, z.array(axisStopSchema).min(1)])
  ) as Record<(typeof NETHER_AXIS_ORDER)[number], z.ZodArray<typeof axisStopSchema>>),
}).superRefine(({ axes }, context) => {
  const expectedLevels = axes[NETHER_AXIS_ORDER[0]].map(({ level }) => level);

  NETHER_AXIS_ORDER.forEach((axisName) => {
    const levels = axes[axisName].map(({ level }) => level);
    const hasSameLevels = levels.length === expectedLevels.length
      && levels.every((level, index) => level === expectedLevels[index]);

    if (!hasSameLevels) {
      context.addIssue({
        code: 'custom',
        message: `Axis ${axisName} must use the same ordered levels as ${NETHER_AXIS_ORDER[0]}`,
        path: ['axes', axisName],
      });
    }
  });
});

export type NetherAxisPoint = z.infer<typeof axisPointSchema>;
export type NetherAxisStop = z.infer<typeof axisStopSchema>;
export type NetherAxesData = z.infer<typeof netherAxesSchema>;

interface NetherAxisPolyline {
  id: string;
  points: NetherAxisPoint[];
}

export const NETHER_AXIS_LINE_WIDTH_BLOCKS = 8;
export const netherAxesData = netherAxesSchema.parse(rawNetherAxesData);

const radialPolylines: NetherAxisPolyline[] = NETHER_AXIS_ORDER.map((axisName) => ({
  id: `nether-axis-${axisName}`,
  points: [netherAxesData.spawn, ...netherAxesData.axes[axisName]].map(toAxisPoint),
}));

const ringPolylines: NetherAxisPolyline[] = netherAxesData.axes[NETHER_AXIS_ORDER[0]]
  .map(({ level }) => {
    const points = NETHER_AXIS_ORDER.map((axisName) => toAxisPoint(
      netherAxesData.axes[axisName].find((stop) => stop.level === level)!
    ));

    return {
      id: `nether-ring-level-${level}`,
      points: [...points, points[0]],
    };
  });

export const netherAxisPolylines = [...radialPolylines, ...ringPolylines];

function toAxisPoint({ x, y, z }: NetherAxisPoint): NetherAxisPoint {
  return { x, y, z };
}
