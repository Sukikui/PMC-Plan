import { z } from 'zod';
import { CONTENT_FIELD_LIMITS } from '@/lib/content/constraints';
import {
  mapEntryCreationSchema,
  mapEntryUpdateSchema,
} from '@/lib/map-entry/schemas';
import { discordUrlSchema } from '@/lib/validation/discord-url';
import { slugSchema } from '@/lib/validation/slug';
import type { ServiceContactType } from './types';

export const SERVICE_ITEM_ID_MAX_LENGTH = 80;

const contactTypeSchema = z.enum([
  'none',
  'primary_manager',
  'custom',
]);

const optionalItemIdSchema = z.string()
  .trim()
  .max(SERVICE_ITEM_ID_MAX_LENGTH)
  .nullable()
  .optional()
  .transform((value) => value || null);

const serviceShape = {
  slug: slugSchema,
  name: z.string().trim().min(1).max(CONTENT_FIELD_LIMITS.name),
  subtitle: z.string().trim().min(1).max(CONTENT_FIELD_LIMITS.shortText),
  description: z.string()
    .trim()
    .min(1, 'La description du service est requise.')
    .max(CONTENT_FIELD_LIMITS.description),
  contactType: contactTypeSchema,
  contactDiscordUrl: discordUrlSchema,
  illustrationItemId: optionalItemIdSchema,
  paymentItemId: optionalItemIdSchema,
  paymentDescription: z.string()
    .trim()
    .max(CONTENT_FIELD_LIMITS.shortText)
    .nullable()
    .optional()
    .transform((value) => value || null),
};

export const createServiceSchema = z.object({
  ...serviceShape,
  management: mapEntryCreationSchema.optional(),
}).superRefine(validateContact);

export const updateServiceSchema = z.object({
  ...serviceShape,
  management: mapEntryUpdateSchema.optional(),
}).superRefine(validateContact);

function validateContact(
  value: {
    contactType: ServiceContactType;
    contactDiscordUrl?: string | null;
  },
  context: z.RefinementCtx,
) {
  if (value.contactType === 'custom' && !value.contactDiscordUrl) {
    context.addIssue({
      code: 'custom',
      message: 'Le lien Discord personnalisé est requis.',
      path: ['contactDiscordUrl'],
    });
  }
}
