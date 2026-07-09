import type { TradeItem as PrismaTradeItem, TradeOffer as PrismaTradeOffer } from '@prisma/client';
import type { TradeItem, TradeOffer } from './types';

const createNegotiableTradeItem = (): TradeItem => ({
  item_id: '',
  quantity: 0,
  enchanted: false,
  custom_name: null,
});

const toTradeItem = (item?: PrismaTradeItem | null): TradeItem => {
  if (!item) {
    return createNegotiableTradeItem();
  }

  return {
    custom_name: item.customName ?? null,
    item_id: item.itemId,
    quantity: item.quantity,
    enchanted: item.enchanted,
  };
};

export const toTradeOffer = (offer: PrismaTradeOffer & { items: PrismaTradeItem[] }): TradeOffer | null => {
  const gives = offer.items.find((item) => item.kind === 'gives');
  if (!gives) {
    return null;
  }

  const wants = offer.items.find((item) => item.kind === 'wants');

  return {
    gives: toTradeItem(gives),
    wants: wants ? toTradeItem(wants) : createNegotiableTradeItem(),
    negotiable: offer.negotiable,
  };
};
