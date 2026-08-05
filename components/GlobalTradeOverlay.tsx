'use client';

import {
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
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
import InfiniteLoadSentinel from '@/components/ui/InfiniteLoadSentinel';
import { useDebouncedValue } from '@/components/ui/useDebouncedValue';
import { serviceListQueryOptions } from '@/lib/services/client';
import { marketOffersQueryOptions } from '@/lib/market/client';
import { themeColors } from '@/lib/theme-colors';

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
  const deferredQuery = useDebouncedValue(query.trim());
  const offerState = useInfiniteQuery({
    ...marketOffersQueryOptions(deferredQuery),
    enabled: activeTab === 'offers',
  });
  const serviceState = useInfiniteQuery({
    ...serviceListQueryOptions(deferredQuery),
    enabled: activeTab === 'services',
  });
  const offers = useMemo(
    () => offerState.data?.pages.flatMap(({ items }) => items) ?? [],
    [offerState.data],
  );
  const services = useMemo(
    () => serviceState.data?.pages.flatMap(({ items }) => items) ?? [],
    [serviceState.data],
  );
  const activeState = activeTab === 'offers'
    ? {
        count: offerState.data?.pages[0]?.pagination.total ?? 0,
        label: 'offre',
        loading: offerState.isPending,
      }
    : {
        count: serviceState.data?.pages[0]?.pagination.total ?? 0,
        label: 'service',
        loading: serviceState.isPending,
      };

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
                  error={offerState.error?.message ?? null}
                  loading={offerState.isPending}
                  empty={offers.length === 0}
                >
                  <GlobalOffersList
                    offers={offers}
                    onOpenPlace={(placeId, selectItem) => {
                      if (placeId) {
                        void openPlaceInfoById(placeId, selectItem);
                      }
                    }}
                    onSelectItem={onSelectItem}
                  />
                  <InfiniteLoadSentinel
                    hasNextPage={Boolean(offerState.hasNextPage)}
                    loading={offerState.isFetchingNextPage}
                    onLoadMore={() => void offerState.fetchNextPage()}
                  />
                </MarketSlideState>
              ),
            },
            {
              value: 'services',
              content: (
                <MarketSlideState
                  error={serviceState.error?.message ?? null}
                  loading={serviceState.isPending}
                  empty={services.length === 0}
                >
                  <GlobalServicesList services={services} />
                  <InfiniteLoadSentinel
                    hasNextPage={Boolean(serviceState.hasNextPage)}
                    loading={serviceState.isFetchingNextPage}
                    onLoadMore={() => void serviceState.fetchNextPage()}
                  />
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
