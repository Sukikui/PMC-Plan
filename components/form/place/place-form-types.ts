import type { TradeOffer as SharedTradeOffer, TradeItem as SharedTradeItem } from '@/lib/api/types';
import type { PlaceCategory } from '@/lib/place/categories';
import type {
  MapEntryCreationPayload,
  MapEntryEditor,
  MapEntryUpdatePayload,
} from '@/lib/map-entry/types';
import type { SpaceReference } from '@/lib/spaces/types';
import { generateFormId } from '../common/form-values';

export interface FormTradeItem extends Omit<SharedTradeItem, 'quantity'> {
  quantity: string | number;
}

export interface FormTradeOffer extends Omit<SharedTradeOffer, 'gives' | 'wants'> {
  id: string;
  gives: FormTradeItem;
  wants: FormTradeItem;
}

export interface FormPlaceImage {
  id: string;
  url: string;
}

export interface InitialPlaceData {
  type: 'place';
  name: string;
  id: string;
  world: string;
  category?: PlaceCategory;
  coordinates: { x: number; y: number; z: number };
  canDelete?: boolean;
  lastEditor?: MapEntryEditor;
  managerIds: string[];
  mapEntryId?: string;
  primaryManagerId: string;
  tags?: string[];
  description?: string;
  address?: string | null;
  discord?: string | null;
  discordOverride?: string | null;
  space?: SpaceReference | null;
  images?: string[];
  trade?: FormTradeOffer[] | null;
}

export interface PlaceFormPayload {
  slug: string;
  name: string;
  world: 'overworld' | 'nether';
  category: PlaceCategory;
  coordinates: { x: number; y: number; z: number };
  description: string | null;
  address: string | null;
  tags: string[];
  discordUrl: string | null;
  spaceId: string | null;
  images: string[];
  management?: MapEntryCreationPayload | MapEntryUpdatePayload;
  tradeOffers: Array<{
    negotiable: boolean;
    description: string | null;
    items: Array<{
      kind: 'gives' | 'wants';
      itemId: string;
      quantity: number;
      enchanted: boolean;
      customName: string | null;
    }>;
  }>;
}

export const createTradeItem = (): FormTradeItem => ({
  item_id: '',
  quantity: '',
  custom_name: null,
  enchanted: false,
});

export const createTradeOffer = (): FormTradeOffer => ({
  id: generateFormId(),
  gives: createTradeItem(),
  wants: createTradeItem(),
  negotiable: false,
  description: null,
});

export const createImageInput = (url = ''): FormPlaceImage => ({
  id: generateFormId(),
  url,
});

export const blankCoords = { x: '', y: '', z: '' };

export type UpdateTradeItem = <K extends keyof FormTradeItem>(
  offerId: string,
  kind: 'gives' | 'wants',
  field: K,
  value: FormTradeItem[K]
) => void;

export type UpdateTradeOffer = <K extends 'description' | 'negotiable'>(
  offerId: string,
  field: K,
  value: FormTradeOffer[K],
) => void;
