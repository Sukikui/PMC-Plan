'use client';

import ClearIcon from '@/components/icons/ClearIcon';
import InfoIcon from '@/components/icons/InfoIcon';
import ShopIcon from '@/components/icons/ShopIcon';
import TradeOverlay from '@/components/TradeOverlay';
import type { Place, Portal } from '@/app/api/utils/shared';
import { themeColors } from '@/lib/theme-colors';
import type React from 'react';
import InfoOverlayDetails from './InfoOverlayDetails';
import PlaceImageCarousel from './PlaceImageCarousel';

interface InfoOverlayContentProps {
  contentRef: React.RefObject<HTMLDivElement | null>;
  item: Place | Portal;
  showBottomBlur: boolean;
  showTradeView: boolean;
  tradeSearchQuery: string;
  type: 'place' | 'portal';
  onShowTradeViewChange: (showTradeView: boolean) => void;
  onTradeSearchQueryChange: (query: string) => void;
}

export default function InfoOverlayContent({
  contentRef,
  item,
  showBottomBlur,
  showTradeView,
  tradeSearchQuery,
  type,
  onShowTradeViewChange,
  onTradeSearchQueryChange,
}: InfoOverlayContentProps) {
  const placeItem = type === 'place' ? item as Place : null;
  const hasTrade = Boolean(placeItem?.trade?.length);

  return (
    <div className="relative flex-1 min-h-0 rounded-b-xl overflow-hidden">
      <div className="relative w-full h-full">
        <div
          className="absolute inset-0 transition-transform duration-300 ease-in-out"
          style={{ transform: showTradeView ? 'translateX(-100%)' : 'translateX(0)' }}
        >
          <div
            ref={!showTradeView ? contentRef : undefined}
            className={`h-full overflow-y-auto px-6 space-y-6 ${themeColors.panel.primary} ${themeColors.transition} ${hasTrade ? 'pt-[4.5rem] pb-12' : 'pt-9 pb-12 rounded-b-xl'}`}
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {placeItem && (
              <PlaceImageCarousel images={placeItem.images ?? []} itemId={item.id} itemName={item.name} />
            )}
            <InfoOverlayDetails item={item} type={type} />
          </div>
        </div>

        <div
          className="absolute inset-0 transition-transform duration-300 ease-in-out"
          style={{ transform: showTradeView ? 'translateX(0)' : 'translateX(100%)' }}
        >
          {placeItem?.trade && placeItem.trade.length > 0 && (
            <div
              ref={showTradeView ? contentRef : undefined}
              className={`h-full overflow-y-auto px-6 pt-[4.5rem] pb-12 ${themeColors.panel.primary} ${themeColors.transition} rounded-b-xl`}
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              <TradeOverlay
                place={placeItem}
                contentOnly={true}
                searchQuery={tradeSearchQuery}
                onSearchChange={onTradeSearchQueryChange}
              />
            </div>
          )}
        </div>
      </div>

      <div className={`absolute top-0 left-0 right-0 h-20 gradient-top-solid-blur z-10 pointer-events-none ${themeColors.transition}`} />
      {hasTrade && (
        <TradeToggle
          searchQuery={tradeSearchQuery}
          showTradeView={showTradeView}
          onSearchQueryChange={onTradeSearchQueryChange}
          onShowTradeViewChange={onShowTradeViewChange}
        />
      )}
      <div className={`absolute bottom-0 left-0 right-0 h-2 ${themeColors.gradient.bottomSolid} z-10 pointer-events-none ${themeColors.transition} ${showBottomBlur ? 'opacity-100' : 'opacity-0'}`} />
      <div className={`absolute bottom-2 left-0 right-0 h-8 ${themeColors.gradient.bottomBlur} z-10 pointer-events-none ${themeColors.transition} ${showBottomBlur ? 'opacity-100' : 'opacity-0'}`} />
    </div>
  );
}

function TradeToggle({
  searchQuery,
  showTradeView,
  onSearchQueryChange,
  onShowTradeViewChange,
}: {
  searchQuery: string;
  showTradeView: boolean;
  onSearchQueryChange: (query: string) => void;
  onShowTradeViewChange: (showTradeView: boolean) => void;
}) {
  return (
    <div className="absolute top-0 left-0 right-0 px-6 pt-4 pb-2 z-20">
      <div className="flex gap-2 items-center h-8">
        <button
          onClick={() => onShowTradeViewChange(false)}
          className={`${themeColors.toggle.base} flex items-center gap-1.5 flex-shrink-0 ${
            !showTradeView ? themeColors.toggle.activeBlue : themeColors.toggle.inactive
          }`}
        >
          <InfoIcon className="w-4 h-4" />
          Informations
        </button>
        <button
          onClick={() => onShowTradeViewChange(true)}
          className={`${themeColors.toggle.base} flex items-center gap-1.5 flex-shrink-0 ${
            showTradeView ? themeColors.toggle.activeBlue : themeColors.toggle.inactive
          }`}
        >
          <ShopIcon className="w-4 h-4" />
          Commerce
        </button>

        <div className={`relative flex-1 ml-2 transition-all duration-300 ease-in-out ${showTradeView ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4 pointer-events-none'}`}>
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => onSearchQueryChange(event.target.value)}
            placeholder="Rechercher un produit, une monnaie..."
            className={`w-full h-8 px-3 text-sm ${themeColors.input.search} border ${themeColors.util.roundedLg} focus:outline-none focus:ring-2 ${themeColors.transition} ${themeColors.placeholder}`}
            disabled={!showTradeView}
          />
          {searchQuery && showTradeView && (
            <button
              onClick={() => onSearchQueryChange('')}
              className={`absolute right-2 top-1/2 transform -translate-y-1/2 ${themeColors.text.secondary} ${themeColors.interactive.hoverText} ${themeColors.transition}`}
            >
              <ClearIcon className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
