import { z } from 'zod';
import {
  CONTENT_FIELD_LIMITS,
  CONTENT_MANAGEMENT_LIMITS,
} from '@/lib/content/constraints';
import { discordUrlSchema } from '@/lib/validation/discord-url';
import { slugSchema } from '@/lib/validation/slug';
import {
  DEFAULT_SPACE_LOGO_BACKGROUND,
  DEFAULT_SPACE_LOGO_ZOOM,
  MAX_SPACE_LOGO_ZOOM,
  MIN_SPACE_LOGO_ZOOM,
  SPACE_LOGO_URL_MAX_LENGTH,
} from './constants';

const nullableText = (maxLength: number) => z
  .string()
  .trim()
  .max(maxLength)
  .nullable()
  .optional()
  .transform((value) => value || null);

const spaceColorSchema = z
  .string()
  .regex(/^#[0-9A-F]{6}$/i, 'La couleur doit être au format hexadécimal.')
  .transform((value) => value.toUpperCase());

const baseSpaceSchema = z.object({
  name: z.string().trim().min(1).max(CONTENT_FIELD_LIMITS.name),
  description: nullableText(CONTENT_FIELD_LIMITS.description),
  discordUrl: discordUrlSchema,
  color: spaceColorSchema,
  logoUrl: z
    .string()
    .trim()
    .url()
    .max(SPACE_LOGO_URL_MAX_LENGTH)
    .nullable()
    .optional()
    .transform((value) => value || null),
  logoBackground: z.enum(['color', 'transparent'])
    .default(DEFAULT_SPACE_LOGO_BACKGROUND),
  logoZoom: z.number()
    .min(MIN_SPACE_LOGO_ZOOM)
    .max(MAX_SPACE_LOGO_ZOOM)
    .default(DEFAULT_SPACE_LOGO_ZOOM),
  managerIds: z.array(z.string().min(1))
    .max(CONTENT_MANAGEMENT_LIMITS.managers),
});

export const CreateSpaceSchema = baseSpaceSchema.extend({
  slug: slugSchema,
  managerIds: baseSpaceSchema.shape.managerIds.default([]),
});

export const UpdateSpaceSchema = baseSpaceSchema.extend({
  slug: slugSchema,
});

export const TransferSpaceSchema = z.object({
  userId: z.string().min(1),
  confirmation: z.string().min(1),
});
