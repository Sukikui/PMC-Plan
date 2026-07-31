import { z } from 'zod';
import { CONTENT_FIELD_LIMITS } from '@/lib/content/constraints';

export const discordUrlSchema = z
  .string()
  .trim()
  .url()
  .max(CONTENT_FIELD_LIMITS.discordUrl)
  .nullable()
  .optional()
  .transform((value) => value || null);
