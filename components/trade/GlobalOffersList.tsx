'use client';

import { useState } from 'react';
import type { TradeOffer } from '@/lib/api/types';
import GlobalOfferSource, {
  GlobalOfferSourceHeader,
} from '@/components/trade/GlobalOfferSource';
import {
  TradeOfferColumnsHeader,
  TradeOfferPreview,
} from '@/components/trade/TradeOfferPreview';
import type { SelectDestinationHandler } from '@/lib/destination/selection';
import type { GlobalOffer } from '@/lib/trade/global-offers';

interface GlobalOffersListProps {
  offers: GlobalOffer[];
  onOpenPlace: (
    placeId: string,
    onSelectItem?: SelectDestinationHandler,
  ) => void;
  onSelectItem?: SelectDestinationHandler;
}

export default function GlobalOffersList({
  offers,
  onOpenPlace,
  onSelectItem,
}: GlobalOffersListProps) {
  const [expandedOffer, setExpandedOffer] = useState<TradeOffer | null>(null);

  return (
    <div>
      <TradeOfferColumnsHeader leading={<GlobalOfferSourceHeader />} />
      <div>
        {offers.map(({ offer, place }, index) => (
          <TradeOfferPreview
            compactItemText
            expandableDescription
            expanded={expandedOffer === offer}
            key={`${place.id || 'unknown'}-${index}`}
            leading={(
              <GlobalOfferSource
                onOpenPlace={() => onOpenPlace(place.id, onSelectItem)}
                place={place}
              />
            )}
            offer={offer}
            onExpandedChange={(expanded) => (
              setExpandedOffer(expanded ? offer : null)
            )}
            variant="list"
          />
        ))}
      </div>
    </div>
  );
}
