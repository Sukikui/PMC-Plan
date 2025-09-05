import { z } from 'zod';
import { normalizeWorldName, WorldName } from '../../../lib/world-utils';

const worldSchema = z.string().transform((val): WorldName | null => {
  return normalizeWorldName(val);
}).refine((val) => val !== null, {
  message: "Invalid world name"
}).optional().nullable();

export const QuerySchema = z.object({
  from_x: z.coerce.number().optional(),
  from_y: z.coerce.number().optional(),
  from_z: z.coerce.number().optional(),
  from_world: worldSchema,
  from_place_id: z.string().optional().nullable(),
  to_x: z.coerce.number().optional(),
  to_y: z.coerce.number().optional(),
  to_z: z.coerce.number().optional(),
  to_world: worldSchema,
  to_place_id: z.string().optional().nullable(),
});

export interface RoutePoint {
  coordinates: {
    x: number;
    y: number;
    z: number;
  };
  world: string;
  name?: string;
  id?: string;
}