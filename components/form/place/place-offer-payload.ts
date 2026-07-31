import { normalizeTradeOfferDescription } from '@/lib/trade-offers';
import type {
  FormTradeOffer,
  PlaceFormPayload,
} from './place-form-types';

export function buildTradeOffersPayload(
  offers: FormTradeOffer[],
): PlaceFormPayload['tradeOffers'] {
  const validationError = getTradeOffersValidationError(offers);
  if (validationError) throw new Error(validationError);

  return offers.map((offer) => ({
    negotiable: offer.negotiable ?? false,
    description: normalizeTradeOfferDescription(offer.description),
    items: [
      {
        kind: 'gives',
        itemId: offer.gives.item_id.trim(),
        quantity: Math.max(1, Number.parseInt(String(offer.gives.quantity), 10) || 1),
        enchanted: offer.gives.enchanted,
        customName: offer.gives.custom_name?.trim() || null,
      },
      ...(!offer.negotiable && offer.wants.item_id.trim()
        ? [{
            kind: 'wants' as const,
            itemId: offer.wants.item_id.trim(),
            quantity: Math.max(1, Number.parseInt(String(offer.wants.quantity), 10) || 1),
            enchanted: offer.wants.enchanted,
            customName: offer.wants.custom_name?.trim() || null,
          }]
        : []),
    ],
  }));
}

export function getTradeOffersValidationError(offers: FormTradeOffer[]) {
  for (const offer of offers) {
    const givesId = offer.gives.item_id.trim();
    const givesQty = Number.parseInt(String(offer.gives.quantity), 10);
    if (!givesId) {
      return 'Chaque offre doit préciser au moins un objet proposé.';
    }
    if (!Number.isFinite(givesQty) || givesQty <= 0) {
      return 'La quantité proposée doit être un entier positif.';
    }

    if (!offer.negotiable) {
      const wantsId = offer.wants.item_id.trim();
      const wantsQty = Number.parseInt(String(offer.wants.quantity), 10);
      if (!wantsId) {
        return 'Précisez l\'objet demandé ou marquez l\'offre comme négociable.';
      }
      if (!Number.isFinite(wantsQty) || wantsQty <= 0) {
        return 'La quantité demandée doit être un entier positif.';
      }
    }
  }

  return null;
}
