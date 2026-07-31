import { CONTENT_FIELD_LIMITS } from '@/lib/content/constraints';

export const MAX_TRADE_OFFER_DESCRIPTION_LENGTH = CONTENT_FIELD_LIMITS.description;
export const MAX_TRADE_ITEM_CUSTOM_NAME_LENGTH = CONTENT_FIELD_LIMITS.customName;

export function normalizeTradeOfferDescription(
  description?: string | null,
): string | null {
  return description?.trim() || null;
}
