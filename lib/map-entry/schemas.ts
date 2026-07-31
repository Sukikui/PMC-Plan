import { z } from 'zod';
import { CONTENT_MANAGEMENT_LIMITS } from '@/lib/content/constraints';

export const mapEntryCreationSchema = z.object({
  managerIds: z.array(z.string().min(1))
    .max(CONTENT_MANAGEMENT_LIMITS.managers)
    .default([]),
  ownerNames: z.array(z.string().trim().min(3).max(16))
    .max(CONTENT_MANAGEMENT_LIMITS.owners)
    .default([]),
  excludedOwnerUuids: z.array(z.string().min(1))
    .max(CONTENT_MANAGEMENT_LIMITS.owners)
    .default([]),
});

export const minecraftOwnerSchema = z.object({
  uuid: z.string().uuid(),
  name: z.string().trim().min(3).max(16),
});

export const mapEntryUpdateSchema = z.object({
  managerIds: mapEntryCreationSchema.shape.managerIds,
  owners: z.array(minecraftOwnerSchema)
    .max(CONTENT_MANAGEMENT_LIMITS.owners)
    .default([]),
  excludedOwnerUuids: mapEntryCreationSchema.shape.excludedOwnerUuids,
  primaryManagerId: z.string().min(1),
  transferConfirmation: z.string().trim().optional(),
});
