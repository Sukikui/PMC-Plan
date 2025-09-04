import { z } from 'zod';

export const QuerySchema = z.object({
  from_x: z.coerce.number().optional(),
  from_y: z.coerce.number().optional(),
  from_z: z.coerce.number().optional(),
  from_world: z.enum(['overworld', 'nether']).optional().nullable(),
  from_place_id: z.string().optional().nullable(),
  to_x: z.coerce.number().optional(),
  to_y: z.coerce.number().optional(),
  to_z: z.coerce.number().optional(),
  to_world: z.enum(['overworld', 'nether']).optional().nullable(),
  to_place_id: z.string().optional().nullable(),
});

export interface RoutePoint {
  coordinates: {
    x: number;
    y: number | undefined;
    z: number;
  };
  world: string;
  name?: string;
  id?: string;
}