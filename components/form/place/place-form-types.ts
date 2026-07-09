import type { TradeOffer as SharedTradeOffer, TradeItem as SharedTradeItem } from '@/app/api/utils/shared';
import { themeColors } from '@/lib/theme-colors';
import type { PlaceCategory } from '@/lib/place/categories';
import { generateFormId } from '../common/form-utils';

export const placeFormInputClass = `${themeColors.input.search} border ${themeColors.util.roundedLg} px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 ${themeColors.transition} ${themeColors.placeholder}`;

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
  owners?: string[];
  tags?: string[];
  description?: string;
  address?: string | null;
  discord?: string | null;
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
  owners: string[];
  tags: string[];
  discordUrl: string | null;
  images: string[];
  tradeOffers: Array<{
    negotiable: boolean;
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

