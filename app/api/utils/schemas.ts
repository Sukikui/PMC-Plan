import { z } from 'zod';

export const coordinateSchema = z.object({
  x: z.number(),
  y: z.number(),
  z: z.number(),
});

export const slugSchema = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[a-z0-9-]+$/, 'Le slug ne doit contenir que des lettres minuscules, des chiffres et des tirets.');

export const ownerSchema = z.string().min(1).max(64);
export const tagSchema = z.string().min(1).max(32);

export const tradeItemSchema = z.object({
  kind: z.enum(['gives', 'wants']),
  itemId: z.string().min(1).max(80),
  quantity: z.number().int().positive(),
  enchanted: z.boolean(),
  customName: z.string().max(120).nullable().optional(),
});

export const tradeOfferSchema = z
  .object({
    negotiable: z.boolean(),
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

export const CreatePlaceSchema = z.object({
  slug: slugSchema,
  name: z.string().min(1).max(120),
  world: z.enum(['overworld', 'nether']),
  coordinates: coordinateSchema,
  description: z.string().max(2000).nullable().optional(),
  owners: z.array(ownerSchema).optional(),
  tags: z.array(tagSchema).optional(),
  discordUrl: z.string().url().max(256).nullable().optional(),
  imageUrl: z.string().url().max(512).nullable().optional(),
  tradeOffers: z.array(tradeOfferSchema).optional(),
});

export const UpdatePlaceSchema = CreatePlaceSchema;

export const singlePortalSchema = z.object({
  mode: z.literal('single'),
  portal: z.object({
    slug: slugSchema,
    name: z.string().min(1).max(120),
    world: z.enum(['overworld', 'nether']),
    coordinates: coordinateSchema,
    description: z.string().max(1000).optional(),
    address: z.string().max(120).optional(),
    ownerNames: z.array(ownerSchema).optional(),
  }),
});

export const linkedPortalSchema = z.object({
  mode: z.literal('linked'),
  slug: slugSchema,
  name: z.string().min(1).max(120),
  owners: z.array(ownerSchema).optional(),
  overworld: z.object({
    coordinates: coordinateSchema,
    description: z.string().max(1000).optional(),
  }),
  nether: z.object({
    coordinates: coordinateSchema,
    description: z.string().max(1000).optional(),
    address: z.string().max(120).optional(),
  }),
});

export const CreatePortalSchema = z.discriminatedUnion('mode', [singlePortalSchema, linkedPortalSchema]);

export const UpdatePortalSchema = CreatePortalSchema;
