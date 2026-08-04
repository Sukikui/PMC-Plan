import { z } from 'zod';

export const contentManagementQuerySchema = z.object({
  filter: z.enum([
    'all',
    'overworld',
    'nether',
    'linked',
    'none',
    'primary_manager',
    'custom',
  ]).default('all'),
  page: z.coerce.number().int().min(1).default(1),
  query: z.string().trim().max(100).default(''),
  type: z.enum(['place', 'portal', 'space', 'service']),
});
