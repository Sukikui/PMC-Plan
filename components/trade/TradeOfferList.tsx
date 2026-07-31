'use client';

import { useEffect, useState } from 'react';
import type { Place, TradeOffer } from '@/lib/api/types';
import { getItemInfo } from '@/lib/minecraft/items';
import { themeColors } from '@/lib/theme-colors';
import {
  TradeOfferColumnsHeader,
  TradeOfferPreview,
} from '@/components/trade/TradeOfferPreview';

interface TradeOfferListProps {
  place: Place;
  searchQuery: string;
}

export default function TradeOfferList({
  place,
  searchQuery,
}: TradeOfferListProps) {
  const [expandedOffer, setExpandedOffer] = useState<TradeOffer | null>(null);
  const [itemNames, setItemNames] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    if (!place.trade) return;

    const loadItemNames = async () => {
      const names = new Map<string, string>();
      const uniqueIds = new Set<string>();

      place.trade?.forEach((offer) => {
        if (offer.gives.item_id) uniqueIds.add(offer.gives.item_id);
        if (!offer.negotiable && offer.wants.item_id) {
          uniqueIds.add(offer.wants.item_id);
        }
      });

      await Promise.all(
        Array.from(uniqueIds).map(async (itemId) => {
          try {
            const data = await getItemInfo(itemId, 'fr_fr');
            names.set(itemId, data.name.toLowerCase());
          } catch (error) {
            console.error(`Failed to load name for ${itemId}:`, error);
          }
        }),
      );

      setItemNames(names);
    };

    void loadItemNames();
  }, [place.trade]);

  if (!place.trade?.length) return null;

  const normalizedQuery = normalizeSearchText(searchQuery);
  const filteredOffers = place.trade.filter((offer) => (
    normalizedQuery === ''
    || tradeOfferMatchesQuery(offer, normalizedQuery, itemNames)
  ));

  return (
    <>
      <TradeOfferColumnsHeader />

      <div>
        {filteredOffers.length === 0 ? (
          <div className={`py-8 text-center ${themeColors.text.tertiary}`}>
            Aucune offre trouvée
          </div>
        ) : (
          filteredOffers.map((offer, index) => (
            <TradeOfferPreview
              key={index}
              compactItemText
              offer={offer}
              expandableDescription
              expanded={expandedOffer === offer}
              variant="list"
              onExpandedChange={(expanded) => (
                setExpandedOffer(expanded ? offer : null)
              )}
            />
          ))
        )}
      </div>
    </>
  );
}

function tradeOfferMatchesQuery(
  offer: TradeOffer,
  query: string,
  itemNames: Map<string, string>,
) {
  return itemMatchesQuery(offer.gives, query, itemNames)
    || itemMatchesQuery(offer.wants, query, itemNames)
    || Boolean(offer.description && normalizeSearchText(offer.description).includes(query));
}

function itemMatchesQuery(
  item: TradeOffer['gives'],
  query: string,
  itemNames: Map<string, string>,
) {
  return Boolean(
    item.custom_name && normalizeSearchText(item.custom_name).includes(query),
  )
    || normalizeSearchText(item.item_id).includes(query)
    || Boolean(
      itemNames.get(item.item_id)
      && normalizeSearchText(itemNames.get(item.item_id)!).includes(query),
    )
    || Boolean(item.lore?.some((line) => normalizeSearchText(line).includes(query)));
}

function normalizeSearchText(value: string) {
  return value.toLowerCase().replace(/\s+/g, '');
}
