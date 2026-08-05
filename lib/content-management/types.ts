import type { ServiceContactType, World } from '@prisma/client';
import type { MapEntryIdentity } from '@/lib/map-entry/types';
import type { PlaceCategory } from '@/lib/place/categories';
import type { SpaceLogoBackground, SpaceReference } from '@/lib/spaces/types';

export type ContentManagementType = 'place' | 'portal' | 'space' | 'service';
export type ContentManagementFilter =
  | 'all'
  | 'overworld'
  | 'nether'
  | 'linked'
  | ServiceContactType;
export type ContentManagementScope = 'all' | 'managed';

interface ContentManagementBase {
  id: string;
  managerCount: number;
  name: string;
  primaryManager: MapEntryIdentity;
  slug: string;
  type: ContentManagementType;
}

interface ContentManagementPlaceSummary extends ContentManagementBase {
  category: PlaceCategory;
  mapEntryId: string;
  space: SpaceReference | null;
  type: 'place';
  world: World;
}

interface ContentManagementPortalSummary extends ContentManagementBase {
  linked: boolean;
  mapEntryId: string;
  space: SpaceReference | null;
  type: 'portal';
  world: World;
}

interface ContentManagementSpaceSummary extends ContentManagementBase {
  color: string;
  discordUrl: string | null;
  logoBackground: SpaceLogoBackground;
  logoUrl: string | null;
  logoZoom: number;
  offerCount: number;
  placeCount: number;
  portalCount: number;
  type: 'space';
}

interface ContentManagementServiceSummary extends ContentManagementBase {
  contactType: ServiceContactType;
  illustrationItemId: string | null;
  mapEntryId: string;
  type: 'service';
}

export type ContentManagementSummary =
  | ContentManagementPlaceSummary
  | ContentManagementPortalSummary
  | ContentManagementSpaceSummary
  | ContentManagementServiceSummary;

export interface ContentManagementResponse {
  items: ContentManagementSummary[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}
