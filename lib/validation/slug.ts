import { z } from 'zod';
import { CONTENT_FIELD_LIMITS } from '@/lib/content/constraints';

export const slugSchema = z
  .string()
  .min(1)
  .max(CONTENT_FIELD_LIMITS.slug)
  .regex(
    /^[a-z0-9-]+$/,
    'Le slug ne doit contenir que des lettres minuscules, des chiffres et des tirets.',
  );
