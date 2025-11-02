'use client';

import { useEffect, useState } from 'react';
import { Place, TradeOffer } from '../app/api/utils/shared';
import { themeColors } from '../lib/theme-colors';
import { getItemInfo } from '../lib/minecraft-items';
import ItemInline from '@/components/trade/ItemInline';
import PlusIcon from './icons/PlusIcon';
import CrossIcon from './icons/CrossIcon';
import ClearIcon from './icons/ClearIcon';

interface TradeOverlayProps {
  place: Place;
  typeStyles?: {
    border: string;
    shadow: string;
    headerBg: string;
    headerBorder: string;
  };
  onBack?: () => void;
  onClose?: () => void;
  contentOnly?: boolean;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

export default function TradeOverlay({ place, typeStyles, onBack, onClose, contentOnly = false, searchQuery: externalSearchQuery, onSearchChange }: TradeOverlayProps) {
  const [internalSearchQuery, setInternalSearchQuery] = useState<string>('');
  const [itemNames, setItemNames] = useState<Map<string, string>>(new Map());

  // Use external search query if provided (contentOnly mode), otherwise use internal
  const searchQuery = externalSearchQuery !== undefined ? externalSearchQuery : internalSearchQuery;
  const setSearchQuery = onSearchChange || setInternalSearchQuery;

  // Load all item names on mount
  useEffect(() => {
    if (!place.trade) return;

    const loadItemNames = async () => {
      const names = new Map<string, string>();
      const uniqueIds = new Set<string>();

      // Collect all unique item IDs
      place.trade!.forEach(offer => {
        if (offer.gives.item_id) uniqueIds.add(offer.gives.item_id);
        if (!offer.negotiable && offer.wants.item_id) uniqueIds.add(offer.wants.item_id);
      });

      // Fetch names for all items
      await Promise.all(
        Array.from(uniqueIds).map(async (itemId) => {
          try {
            const data = await getItemInfo(itemId, 'fr_fr');
            names.set(itemId, data.name.toLowerCase());
          } catch (err) {
            console.error(`Failed to load name for ${itemId}:`, err);
          }
        })
      );

      setItemNames(names);
    };

    loadItemNames();
  }, [place.trade]);

  if (!place.trade || place.trade.length === 0) return null;

  // Filter trades based on search query
  const filteredTrades = place.trade.filter(offer => {
    if (searchQuery === '') return true;

    const query = searchQuery.toLowerCase().replace(/\s+/g, '');

    // Helper to normalize text by removing spaces
    const normalize = (text: string) => text.toLowerCase().replace(/\s+/g, '');

    // Search in gives item
    const givesMatch =
      (offer.gives.custom_name && normalize(offer.gives.custom_name).includes(query)) ||
      normalize(offer.gives.item_id).includes(query) ||
      (itemNames.get(offer.gives.item_id) && normalize(itemNames.get(offer.gives.item_id)!).includes(query)) ||
      (offer.gives.lore && offer.gives.lore.some(line => normalize(line).includes(query)));

    // Search in wants item
    const wantsMatch =
      (offer.wants.custom_name && normalize(offer.wants.custom_name).includes(query)) ||
      normalize(offer.wants.item_id).includes(query) ||
      (itemNames.get(offer.wants.item_id) && normalize(itemNames.get(offer.wants.item_id)!).includes(query)) ||
      (offer.wants.lore && offer.wants.lore.some(line => normalize(line).includes(query)));

    return givesMatch || wantsMatch;
  });

  // Render only the trade content without wrapper (used in InfoOverlay)
  if (contentOnly) {
    return (
      <>
        {/* Headers - displayed once */}
        <div className="flex items-center gap-4 mb-4">
          <h4 className={`text-sm font-semibold ${themeColors.text.secondary} uppercase tracking-wide flex-1 text-center`}>
            Propose
          </h4>
          <div className="w-6"></div> {/* Spacer for arrow */}
          <h4 className={`text-sm font-semibold ${themeColors.text.secondary} uppercase tracking-wide flex-1 text-center`}>
            Demande
          </h4>
        </div>

        {/* Trade offers */}
        <div className="space-y-4">
          {filteredTrades.length === 0 ? (
            <div className={`text-center py-8 ${themeColors.text.tertiary}`}>
              Aucune offre trouvée
            </div>
          ) : (
            filteredTrades.map((offer, index) => (
              <TradeOfferCard key={index} offer={offer} index={index} />
            ))
          )}
        </div>
      </>
    );
  }

  // Render full overlay with header and wrapper
  return (
    <div className={`relative ${themeColors.panel.primary} ${themeColors.blur} ${themeColors.util.roundedXl} [box-shadow:0_0_25px_0_var(--tw-shadow-color)] ${typeStyles!.shadow} w-full max-w-lg min-w-0 h-[95vh] border ${typeStyles!.border} ${themeColors.transition} flex flex-col`} style={{ width: 'min(32rem, calc(100vw - 2rem))' }}>
      {/* Header */}
      <div className={`flex-shrink-0 p-6 border-b ${typeStyles!.headerBorder} ${typeStyles!.headerBg} ${themeColors.transition} rounded-t-xl`}>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h2 className={`text-2xl font-bold ${themeColors.text.primary} ${themeColors.transition}`}>Commerce</h2>
            <p className={`text-sm ${themeColors.text.tertiary} ${themeColors.transition}`}>
              {place.trade.length} offre{place.trade.length > 1 ? 's' : ''} disponible{place.trade.length > 1 ? 's' : ''}
            </p>
          </div>

          {/* Back and Close buttons */}
          <div className="flex gap-2">
            {onBack && (
              <button
                onClick={onBack}
                className={`p-1 ${themeColors.util.roundedFull} ${themeColors.button.secondary} border ${themeColors.border.light} ${themeColors.shadow.button} transition-all duration-200 ${themeColors.util.hoverScale} ${themeColors.util.activeScale} flex-shrink-0 ${themeColors.interactive.hoverBorder}`}
                aria-label="Retour aux informations"
              >
                <PlusIcon className={`w-4 h-4 ${themeColors.text.secondary} transform rotate-45`} />
              </button>
            )}
            {onClose && (
              <button
                onClick={onClose}
                className={`p-1 ${themeColors.util.roundedFull} ${themeColors.button.secondary} border ${themeColors.border.light} ${themeColors.shadow.button} transition-all duration-200 ${themeColors.util.hoverScale} ${themeColors.util.activeScale} flex-shrink-0 ${themeColors.interactive.hoverBorder}`}
                aria-label="Fermer"
              >
                <CrossIcon className={`w-4 h-4 ${themeColors.text.secondary}`} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className={`relative flex-1 min-h-0 ${themeColors.panel.primary} ${themeColors.transition} rounded-b-xl overflow-hidden`}>
        {/* Scrollable content */}
        <div className="h-full overflow-y-auto px-6 pt-6 pb-24 [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {/* Headers - displayed once */}
          <div className="flex items-center gap-4 mb-4">
            <h4 className={`text-sm font-semibold ${themeColors.text.secondary} uppercase tracking-wide flex-1 text-center`}>
              Propose
            </h4>
            <div className="w-6"></div> {/* Spacer for arrow */}
            <h4 className={`text-sm font-semibold ${themeColors.text.secondary} uppercase tracking-wide flex-1 text-center`}>
              Demande
            </h4>
          </div>

          {/* Trade offers */}
          <div className="space-y-4">
            {filteredTrades.length === 0 ? (
              <div className={`text-center py-8 ${themeColors.text.tertiary}`}>
                Aucune offre trouvée
              </div>
            ) : (
              filteredTrades.map((offer, index) => (
                <TradeOfferCard key={index} offer={offer} index={index} />
              ))
            )}
          </div>
        </div>

        {/* Bottom gradient - above content but below search bar */}
        <div className={`absolute bottom-14 left-0 right-0 h-8 ${themeColors.gradient.bottomBlur} z-10 pointer-events-none ${themeColors.transition}`} />

        {/* Search Bar - fixed at bottom */}
        <div className={`absolute bottom-0 left-0 right-0 ${themeColors.panel.primary} z-20 px-6 pb-4`}>
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un objet..."
              className={`w-full px-3 py-2 text-sm ${themeColors.input.search} border ${themeColors.util.roundedLg} focus:outline-none focus:ring-2 ${themeColors.transition} ${themeColors.placeholder}`}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className={`absolute right-2 top-1/2 transform -translate-y-1/2 ${themeColors.text.secondary} ${themeColors.interactive.hoverText} ${themeColors.transition}`}
              >
                <ClearIcon className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Individual Trade Offer Component
interface TradeOfferCardProps {
  offer: TradeOffer;
  index: number;
}

function TradeOfferCard({ offer}: TradeOfferCardProps) {
  return (
    <div className={`${themeColors.infoOverlay.descriptionBg} border ${themeColors.border.primary} ${themeColors.util.roundedLg} p-4 ${themeColors.transition}`}>
      <div className="flex items-center gap-4">
        {/* Gives section */}
        <div className="flex-1">
          <ItemDisplay item={offer.gives} type="gives" />
        </div>

        {/* Arrow */}
        <div className={`${themeColors.text.tertiary} flex-shrink-0 mx-2`}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </div>

        {/* Wants section */}
        <div className="flex-1">
          {offer.negotiable ? <NegotiablePlaceholder /> : <ItemDisplay item={offer.wants} type="wants" />}
        </div>
      </div>
    </div>
  );
}

const NegotiablePlaceholder = () => (
  <div className="flex items-center gap-3 min-w-0 pl-2">
    <span className={`text-sm font-semibold ${themeColors.text.primary}`}>Sur demande</span>
  </div>
);

// Individual Item Display Component
interface ItemDisplayProps {
  item: {
    custom_name?: string | null;
    item_id: string;
    quantity: number;
    enchanted: boolean;
    lore?: string[];
  };
  type: 'gives' | 'wants';
}

function ItemDisplay({ item}: ItemDisplayProps) {
  return (
    <div className="space-y-2">
      <ItemInline item={item} />
      {/* Lore */}
      {item.lore && item.lore.length > 0 && (
        <div className={`text-xs ${themeColors.text.quaternary} pl-11 space-y-1`}>
          {item.lore.map((line, i) => (
            <div key={i} className="italic">&quot;{line}&quot;</div>
          ))}
        </div>
      )}
    </div>
  );
}