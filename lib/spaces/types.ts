import type {
  MapEntryUser,
  MinecraftOwner,
} from '@/lib/map-entry/types';
import type { PlaceCategory } from '@/lib/place/categories';

export type SpaceUser = Pick<
  MapEntryUser,
  'id' | 'name' | 'username' | 'image' | 'role'
>;

export interface SpaceEditor
  extends Pick<SpaceUser, 'id' | 'name' | 'username' | 'image'> {
  editedAt: string;
}

export type SpaceLogoBackground = 'color' | 'transparent';

export interface SpaceReference {
  id: string;
  slug: string;
  name: string;
  color: string;
  logoUrl: string | null;
  logoBackground: SpaceLogoBackground;
  logoZoom: number;
  discordUrl: string | null;
}

export interface SpaceImage {
  id: string;
  url: string;
  placeId: string;
  placeSlug: string;
  placeName: string;
}

export interface SpacePlaceSummary {
  category: PlaceCategory;
  mapEntryId: string;
  name: string;
  owners: MinecraftOwner[];
  slug: string;
  world: 'overworld' | 'nether';
}

export interface SpacePortalSummary {
  linked: boolean;
  mapEntryId: string;
  name: string;
  owners: MinecraftOwner[];
  slug: string;
  world: 'overworld' | 'nether';
}

export interface Space extends SpaceReference {
  description: string | null;
  offerCount: number;
  images: SpaceImage[];
  members: MinecraftOwner[];
  places: SpacePlaceSummary[];
  portals: SpacePortalSummary[];
  primaryManagerId: string;
  managerIds: string[];
  primaryManager: SpaceUser;
  managers: SpaceUser[];
  lastEditor: SpaceEditor;
  createdAt: string;
  updatedAt: string;
}

export interface SpaceSummary extends SpaceReference {
  description: string | null;
  firstMember: MinecraftOwner | null;
  memberCount: number;
  offerCount: number;
  placeCount: number;
  portalCount: number;
  previewImage: string | null;
}

export interface SpaceInput {
  name: string;
  slug: string;
  description?: string | null;
  color: string;
  logoUrl?: string | null;
  logoBackground?: SpaceLogoBackground;
  logoZoom?: number;
  discordUrl?: string | null;
  managerIds: string[];
}

export type SpaceUpdateInput = SpaceInput;

export interface SpaceActor {
  userId: string;
  role?: string;
}
