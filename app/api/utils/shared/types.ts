import type { PlaceCategory } from '@/lib/place/categories';

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
  owners: string[];
  slug?: string;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
  "nether-associate": {
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
  owners?: string[];
  discord: string | null;
  trade?: TradeOffer[] | null;
  createdById: string;
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

export interface NetherStop extends Coordinates {
  level: number;
}

export interface NetherData {
  spawn: Coordinates;
  axes: {
    [key: string]: NetherStop[];
  };
}
