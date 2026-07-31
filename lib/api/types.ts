import type { MapEntryEditor, MapEntryIdentity, MinecraftOwner } from '@/lib/map-entry/types';
import type { NetherAxesData, NetherAxisStop } from '@/lib/nether/network-data';
import type { PlaceCategory } from '@/lib/place/categories';
import type { SpaceReference } from '@/lib/spaces/types';

export interface Coordinates {
  x: number;
  y: number;
  z: number;
}

export interface Portal {
  id: string;
  name: string;
  world: string;
  coordinates: Coordinates;
  description: string | null;
  address: string;
  owners: MinecraftOwner[];
  space: SpaceReference | null;
  lastEditor: MapEntryEditor;
  slug: string;
  mapEntryId: string;
  primaryManagerId: string;
  primaryManager: MapEntryIdentity;
  managerIds: string[];
  createdAt: Date;
  updatedAt: Date;
  'nether-associate': {
    coordinates: Coordinates;
    address: string;
    description: string | null;
  } | null;
}

export interface PortalWithDistance extends Portal {
  distance: number;
}

export interface TradeItem {
  custom_name?: string | null;
  item_id: string;
  quantity: number;
  enchanted: boolean;
  lore?: string[];
}

export interface TradeOffer {
  gives: TradeItem;
  wants: TradeItem;
  negotiable?: boolean;
  description?: string | null;
}

export interface Place {
  id: string;
  name: string;
  world: string;
  coordinates: Coordinates;
  description: string | null;
  address?: string | null;
  category: PlaceCategory;
  images: string[];
  tags: string[];
  owners: MinecraftOwner[];
  lastEditor: MapEntryEditor;
  discord: string | null;
  discordOverride: string | null;
  space: SpaceReference | null;
  trade?: TradeOffer[] | null;
  mapEntryId: string;
  primaryManagerId: string;
  primaryManager: MapEntryIdentity;
  managerIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface NetherAddress {
  address?: string;
  nearestStop?: {
    axis: string;
    level: number | null;
    coordinates: Coordinates;
    distance: number;
  };
  direction?: string;
  error?: string;
}

export type NetherStop = NetherAxisStop;
export type NetherData = NetherAxesData;
