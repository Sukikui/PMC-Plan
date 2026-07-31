'use client';

import {
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import PlusIcon from '@/components/icons/PlusIcon';
import GlobalMarketToolbar, {
  type GlobalMarketTab,
} from '@/components/market/GlobalMarketToolbar';
import { useOverlay } from '@/components/overlay/OverlayProvider';
import GlobalServicesList from '@/components/services/GlobalServicesList';
import GlobalOffersList from '@/components/trade/GlobalOffersList';
import EmptySearchResult from '@/components/ui/EmptySearchResult';
import IconActionButton from '@/components/ui/IconActionButton';
import OverlayHeader from '@/components/ui/OverlayHeader';
import { OverlaySlideTrack } from '@/components/ui/OverlaySlider';
import OverlaySurface from '@/components/ui/OverlaySurface';
import type { SelectDestinationHandler } from '@/lib/destination/selection';
import { useInvalidatedCollection } from '@/components/ui/useInvalidatedCollection';
import {
  fetchServices,
  subscribeToServicesInvalidation,
} from '@/lib/services/client';
import { filterServices } from '@/lib/services/search';
import {
  loadPlacesData,
  subscribeToMainScreenDataInvalidation,
} from '@/lib/preload/main-screen';
import { themeColors } from '@/lib/theme-colors';
import {
  filterGlobalOffers,
  flattenPlaceOffers,
  type GlobalOffer,
} from '@/lib/trade/global-offers';

interface GlobalTradeOverlayProps {
  onBack?: () => void;
  onClose?: () => void;
  onSelectItem?: SelectDestinationHandler;
}

export default function GlobalTradeOverlay({
  onBack,
  onClose,
  onSelectItem,
}: GlobalTradeOverlayProps) {
  const { openPlaceInfoById } = useOverlay();
  const [activeTab, setActiveTab] = useState<GlobalMarketTab>('offers');
  const [query, setQuery] = useState('');
  const offerState = useInvalidatedCollection({
    enabled: activeTab === 'offers',
    errorMessage: 'Impossible de charger les offres.',
    loadItems: loadGlobalOffers,
    subscribe: subscribeToMainScreenDataInvalidation,
  });
  const serviceState = useInvalidatedCollection({
    enabled: activeTab === 'services',
    errorMessage: 'Impossible de charger les services.',
    loadItems: fetchServices,
    subscribe: subscribeToServicesInvalidation,
  });
  const filteredOffers = useMemo(
    () => filterGlobalOffers(offerState.items, query),
    [offerState.items, query],
  );
  const filteredServices = useMemo(
    () => filterServices(serviceState.items, query),
    [query, serviceState.items],
  );
  const activeState = activeTab === 'offers'
    ? { ...offerState, count: filteredOffers.length, label: 'offre' }
    : { ...serviceState, count: filteredServices.length, label: 'service' };

  return (
    <OverlaySurface ariaLabel="Place de marché" size="wide">
      <OverlayHeader
        actions={onBack ? (
          <IconActionButton aria-label="Retour" onClick={onBack}>
            <PlusIcon className={`h-4 w-4 rotate-45 ${themeColors.text.secondary}`} />
          </IconActionButton>
        ) : undefined}
        onClose={onClose}
        subtitle={activeState.loading
          ? 'Chargement…'
          : `${activeState.count} ${activeState.label}${activeState.count > 1 ? 's' : ''}`}
        title="Place de marché"
      />

      <div className={`relative min-h-0 flex-1 overflow-hidden rounded-b-xl ${themeColors.panel.primary} ${themeColors.transition}`}>
        <div className={`pointer-events-none absolute inset-x-0 top-0 z-10 h-20 gradient-top-solid-blur ${themeColors.transition}`} />
        <GlobalMarketToolbar
          activeTab={activeTab}
          onQueryChange={setQuery}
          onTabChange={setActiveTab}
          query={query}
        />

        <OverlaySlideTrack
          activeValue={activeTab}
          baseSlideClassName="h-full overflow-y-auto px-8 pb-12 pt-[4.5rem] [&::-webkit-scrollbar]:hidden [scrollbar-width:none]"
          slides={[
            {
              value: 'offers',
              content: (
                <MarketSlideState
                  error={offerState.error}
                  loading={offerState.loading}
                  empty={filteredOffers.length === 0}
                >
                  <GlobalOffersList
                    offers={filteredOffers}
                    onOpenPlace={(placeId, selectItem) => {
                      if (placeId) {
                        void openPlaceInfoById(placeId, selectItem);
                      }
                    }}
                    onSelectItem={onSelectItem}
                  />
                </MarketSlideState>
              ),
            },
            {
              value: 'services',
              content: (
                <MarketSlideState
                  error={serviceState.error}
                  loading={serviceState.loading}
                  empty={filteredServices.length === 0}
                >
                  <GlobalServicesList services={filteredServices} />
                </MarketSlideState>
              ),
            },
          ]}
        />

        <div className={`pointer-events-none absolute inset-x-0 bottom-0 z-10 h-2 ${themeColors.gradient.bottomSolid} ${themeColors.transition}`} />
        <div className={`pointer-events-none absolute inset-x-0 bottom-2 z-10 h-8 ${themeColors.gradient.bottomBlur} ${themeColors.transition}`} />
      </div>
    </OverlaySurface>
  );
}

function MarketSlideState({
  children,
  empty,
  error,
  loading,
}: {
  children: ReactNode;
  empty: boolean;
  error: string | null;
  loading: boolean;
}) {
  if (error) {
    return (
      <p className={`py-8 text-center ${themeColors.text.tertiary}`}>
        {error}
      </p>
    );
  }
  if (!loading && empty) return <EmptySearchResult />;
  if (loading) {
    return (
      <p className={`py-8 text-center text-sm ${themeColors.text.tertiary}`}>
        Chargement…
      </p>
    );
  }
  return children;
}

const loadGlobalOffers = async (): Promise<GlobalOffer[]> => (
  flattenPlaceOffers(await loadPlacesData())
);
