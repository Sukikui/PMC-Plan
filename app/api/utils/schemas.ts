import { z } from 'zod';
import {
  CONTENT_FIELD_LIMITS,
} from '@/lib/content/constraints';
import {
  mapEntryCreationSchema,
  mapEntryUpdateSchema,
} from '@/lib/map-entry/schemas';
import { DEFAULT_PLACE_CATEGORY, PLACE_CATEGORIES } from '@/lib/place/categories';
import { MAX_PLACE_IMAGE_URLS, PLACE_IMAGE_URL_MAX_LENGTH } from '@/lib/place/images';
import { MAX_TRADE_OFFER_DESCRIPTION_LENGTH } from '@/lib/trade-offers';
import { discordUrlSchema } from '@/lib/validation/discord-url';
import { slugSchema } from '@/lib/validation/slug';

export const coordinateSchema = z.object({
  x: z.number(),
  y: z.number(),
  z: z.number(),
});

export const tagSchema = z.string().min(1).max(32);
export const placeImageUrlSchema = z.string().trim().url().max(PLACE_IMAGE_URL_MAX_LENGTH);
export const mapEntrySpaceIdSchema = z.string().min(1).nullable().optional();

export const tradeItemSchema = z.object({
  kind: z.enum(['gives', 'wants']),
  itemId: z.string().min(1).max(80),
  quantity: z.number().int().positive(),
  enchanted: z.boolean(),
  customName: z.string().max(CONTENT_FIELD_LIMITS.customName).nullable().optional(),
});

export const tradeOfferSchema = z
  .object({
    negotiable: z.boolean(),
    description: z.string().trim().max(MAX_TRADE_OFFER_DESCRIPTION_LENGTH).nullable().optional(),
    items: z.array(tradeItemSchema).min(1),
  })
  .superRefine((offer, ctx) => {
    const hasGives = offer.items.some((item) => item.kind === 'gives');
    if (!hasGives) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Chaque offre doit contenir au moins un item proposé.',
        path: ['items'],
      });
    }
    if (!offer.negotiable) {
      const hasWants = offer.items.some((item) => item.kind === 'wants');
      if (!hasWants) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Les offres non négociables doivent préciser un item demandé.',
          path: ['items'],
        });
      }
    }
  });

const placeSchema = z.object({
  slug: slugSchema,
  name: z.string().min(1).max(CONTENT_FIELD_LIMITS.name),
  world: z.enum(['overworld', 'nether']),
  category: z.enum(PLACE_CATEGORIES).default(DEFAULT_PLACE_CATEGORY),
  coordinates: coordinateSchema,
  description: z.string()
    .max(CONTENT_FIELD_LIMITS.description)
    .nullable()
    .optional(),
  address: z.string().max(120).nullable().optional(),
  tags: z.array(tagSchema).optional(),
  discordUrl: discordUrlSchema,
  spaceId: mapEntrySpaceIdSchema,
  images: z.array(placeImageUrlSchema).max(MAX_PLACE_IMAGE_URLS).optional(),
  tradeOffers: z.array(tradeOfferSchema).optional(),
});

export const CreatePlaceSchema = placeSchema.extend({
  management: mapEntryCreationSchema.optional(),
});

export const UpdatePlaceSchema = placeSchema.extend({
  management: mapEntryUpdateSchema.optional(),
});

const singlePortalSchema = z.object({
  mode: z.literal('single'),
  spaceId: mapEntrySpaceIdSchema,
  portal: z.object({
    slug: slugSchema,
    name: z.string().min(1).max(CONTENT_FIELD_LIMITS.name),
    world: z.enum(['overworld', 'nether']),
    coordinates: coordinateSchema,
    description: z.string()
      .max(CONTENT_FIELD_LIMITS.description)
      .optional(),
    address: z.string().max(120).optional(),
  }),
});

const linkedPortalSchema = z.object({
  mode: z.literal('linked'),
  spaceId: mapEntrySpaceIdSchema,
  slug: slugSchema,
  name: z.string().min(1).max(CONTENT_FIELD_LIMITS.name),
  overworld: z.object({
    coordinates: coordinateSchema,
    description: z.string()
      .max(CONTENT_FIELD_LIMITS.description)
      .optional(),
  }),
  nether: z.object({
    coordinates: coordinateSchema,
    description: z.string()
      .max(CONTENT_FIELD_LIMITS.description)
      .optional(),
    address: z.string().max(120).optional(),
  }),
});

export const CreatePortalSchema = z.discriminatedUnion('mode', [
  singlePortalSchema.extend({ management: mapEntryCreationSchema.optional() }),
  linkedPortalSchema.extend({ management: mapEntryCreationSchema.optional() }),
]);

export const UpdatePortalSchema = z.discriminatedUnion('mode', [
  singlePortalSchema.extend({ management: mapEntryUpdateSchema.optional() }),
  linkedPortalSchema.extend({ management: mapEntryUpdateSchema.optional() }),
]);
