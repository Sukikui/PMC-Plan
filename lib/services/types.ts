import type {
  MapEntryAccess,
  MapEntryCreationPayload,
  MapEntryEditor,
  MapEntryIdentity,
  MapEntryUpdatePayload,
  MinecraftOwner,
} from '@/lib/map-entry/types';

export interface Service extends MapEntryAccess {
  id: string;
  slug: string;
  name: string;
  subtitle: string;
  description: string;
  contactType: ServiceContactType;
  contactDiscordUrl: string | null;
  illustrationItemId: string | null;
  paymentItemId: string | null;
  paymentDescription: string | null;
  owners: MinecraftOwner[];
  primaryManager: MapEntryIdentity;
  lastEditor: MapEntryEditor;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceInput {
  name: string;
  subtitle: string;
  slug: string;
  description: string;
  contactType: ServiceContactType;
  contactDiscordUrl?: string | null;
  illustrationItemId?: string | null;
  paymentItemId?: string | null;
  paymentDescription?: string | null;
  management?: MapEntryCreationPayload | MapEntryUpdatePayload;
}

export type ServiceContactType = 'none' | 'primary_manager' | 'custom';

export interface ServiceResponse {
  service: Service;
}

export interface ServicesResponse {
  services: Service[];
}
