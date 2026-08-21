import { z } from 'zod';
import {
  CONTENT_FIELD_LIMITS,
} from '@/lib/content/constraints';
import {
  contentColorSchema,
  DEFAULT_CONTENT_COLOR,
} from '@/lib/content/colors';
import {
  mapEntryCreationSchema,
  mapEntryUpdateSchema,
} from '@/lib/map-entry/schemas';
import { DEFAULT_PLACE_CATEGORY, PLACE_CATEGORIES } from '@/lib/place/categories';
import {
  CONTENT_IMAGE_URL_MAX_LENGTH,
  MAX_CONTENT_IMAGE_URLS,
} from '@/lib/content/images';
import { MAX_TRADE_OFFER_DESCRIPTION_LENGTH } from '@/lib/trade-offers';
import { discordUrlSchema } from '@/lib/validation/discord-url';
import { slugSchema } from '@/lib/validation/slug';

const coordinateSchema = z.object({
  x: z.number(),
  y: z.number(),
  z: z.number(),
});

const tagSchema = z.string().min(1).max(32);
const contentImageUrlSchema = z.string()
  .trim()
  .url()
  .max(CONTENT_IMAGE_URL_MAX_LENGTH);
const contentImagesSchema = z.array(contentImageUrlSchema)
  .max(MAX_CONTENT_IMAGE_URLS)
  .optional();
const mapEntrySpaceIdSchema = z.string().min(1).nullable().optional();

const tradeItemSchema = z.object({
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
  color: contentColorSchema,
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
  images: contentImagesSchema,
  tradeOffers: z.array(tradeOfferSchema).optional(),
});

export const CreatePlaceSchema = placeSchema.extend({
  color: contentColorSchema.default(DEFAULT_CONTENT_COLOR),
  management: mapEntryCreationSchema.optional(),
});

export const UpdatePlaceSchema = placeSchema.extend({
  color: contentColorSchema.optional(),
  management: mapEntryUpdateSchema.optional(),
});

const singlePortalSchema = z.object({
  color: contentColorSchema,
  images: contentImagesSchema,
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
  color: contentColorSchema,
  images: contentImagesSchema,
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
  singlePortalSchema.extend({
    color: contentColorSchema.default(DEFAULT_CONTENT_COLOR),
    management: mapEntryCreationSchema.optional(),
  }),
  linkedPortalSchema.extend({
    color: contentColorSchema.default(DEFAULT_CONTENT_COLOR),
    management: mapEntryCreationSchema.optional(),
  }),
]);

export const UpdatePortalSchema = z.discriminatedUnion('mode', [
  singlePortalSchema.extend({
    color: contentColorSchema.optional(),
    management: mapEntryUpdateSchema.optional(),
  }),
  linkedPortalSchema.extend({
    color: contentColorSchema.optional(),
    management: mapEntryUpdateSchema.optional(),
  }),
]);
