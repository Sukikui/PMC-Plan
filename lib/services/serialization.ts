import type { Prisma } from '@prisma/client';
import {
  publicMapEntryInclude,
  toMapEntryAccess,
  toMapEntryEditor,
  toMapEntryPrimaryManager,
  toMinecraftOwners,
} from '@/lib/map-entry/serialization';
import type { Service } from './types';

export const serviceInclude = {
  mapEntry: {
    include: publicMapEntryInclude,
  },
} satisfies Prisma.ServiceInclude;

type ServiceRecord = Prisma.ServiceGetPayload<{
  include: typeof serviceInclude;
}>;

export function toService(record: ServiceRecord): Service {
  return {
    id: record.slug,
    slug: record.slug,
    name: record.name,
    subtitle: record.subtitle,
    description: record.description,
    contactType: record.contactType,
    contactDiscordUrl: record.contactDiscordUrl,
    illustrationItemId: record.illustrationItemId,
    paymentItemId: record.paymentItemId,
    paymentDescription: record.paymentDescription,
    ...toMapEntryAccess(record.mapEntry),
    owners: toMinecraftOwners(record.mapEntry),
    primaryManager: toMapEntryPrimaryManager(record.mapEntry),
    lastEditor: toMapEntryEditor(record.mapEntry),
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}
