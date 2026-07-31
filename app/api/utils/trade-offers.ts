import type { z } from 'zod';
import { normalizeTradeOfferDescription } from '@/lib/trade-offers';
import type { tradeOfferSchema } from './schemas';

type TradeOfferInput = z.infer<typeof tradeOfferSchema>;

export function buildTradeOffersCreateData(offers?: TradeOfferInput[]) {
  return (offers ?? []).map((offer) => ({
    negotiable: offer.negotiable,
    description: normalizeTradeOfferDescription(offer.description),
    items: {
      create: offer.items.map((item) => ({
        kind: item.kind,
        itemId: item.itemId,
        quantity: item.quantity,
        enchanted: item.enchanted,
        customName: item.customName?.trim() || null,
      })),
    },
  }));
}
