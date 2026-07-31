'use client';

import ClearIcon from '@/components/icons/ClearIcon';
import InfoIcon from '@/components/icons/InfoIcon';
import ShopIcon from '@/components/icons/ShopIcon';
import TradeOfferList from '@/components/trade/TradeOfferList';
import { OverlaySlideTrack } from '@/components/ui/OverlaySlider';
import type { Place, Portal } from '@/lib/api/types';
import { themeColors } from '@/lib/theme-colors';
import type React from 'react';
import InfoImageCarousel from './InfoImageCarousel';
import InfoOverlayBody from './InfoOverlayBody';
import InfoOverlayDetails from './InfoOverlayDetails';

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
    <InfoOverlayBody
      floatingContent={hasTrade ? (
        <TradeToggle
          searchQuery={tradeSearchQuery}
          showTradeView={showTradeView}
          onSearchQueryChange={onTradeSearchQueryChange}
          onShowTradeViewChange={onShowTradeViewChange}
        />
      ) : null}
      showBottomBlur={showBottomBlur}
    >
      <div className="relative w-full h-full">
        <OverlaySlideTrack
          activeValue={showTradeView ? 'trade' : 'information'}
          slides={[
            {
              value: 'information',
              elementRef: !showTradeView ? contentRef : undefined,
              className: `h-full overflow-y-auto px-6 space-y-6 ${themeColors.panel.primary} ${themeColors.transition} ${hasTrade ? 'pt-[4.5rem] pb-12' : 'pt-9 pb-12 rounded-b-xl'} [&::-webkit-scrollbar]:hidden [scrollbar-width:none]`,
              content: (
                <>
                  {placeItem && (
                    <InfoImageCarousel
                      carouselId={item.id}
                      images={(placeItem.images ?? []).map((src, index) => ({
                        id: `${item.id}-${index}`,
                        src,
                        alt: `Image ${index + 1} de ${item.name}`,
                      }))}
                    />
                  )}
                  <InfoOverlayDetails item={item} type={type} />
                </>
              ),
            },
            {
              value: 'trade',
              elementRef: showTradeView ? contentRef : undefined,
              className: `h-full overflow-y-auto px-6 pt-[4.5rem] pb-12 ${themeColors.panel.primary} ${themeColors.transition} rounded-b-xl [&::-webkit-scrollbar]:hidden [scrollbar-width:none]`,
              content: placeItem?.trade?.length
                ? <TradeOfferList place={placeItem} searchQuery={tradeSearchQuery} />
                : null,
            },
          ]}
        />
      </div>
    </InfoOverlayBody>
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
          Offres
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
