'use client';

import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import InfoOverlay from '@/components/InfoOverlay';
import Overlay from '@/components/ui/Overlay';
import GlobalTradeOverlay from '@/components/GlobalTradeOverlay';
import FormOverlay from '@/components/form/FormOverlay';
import type { Place, Portal } from '@/app/api/utils/shared';
import type { SelectDestinationHandler } from '@/lib/destination/selection';
import type { InitialPlaceData, PlaceFormPayload } from '@/components/form/place/PlaceForm';
import type { InitialPortalData, PortalFormPayload } from '@/components/form/portal/PortalForm';

type OverlayType = 'place' | 'portal';

interface OverlayState {
  isOpen: boolean;
  item: Place | Portal | null;
  type: OverlayType;
  onSelectItem?: SelectDestinationHandler;
}

interface FormOverlayState {
  isOpen: boolean;
  isClosing: boolean;
  mode: 'add' | 'edit';
  initialData?: (InitialPlaceData & { type: 'place' }) | (InitialPortalData & { type: 'portal' });
}

interface OverlayContextValue {
  openPlaceInfoById: (placeId: string, onSelectItem?: SelectDestinationHandler) => Promise<void>;
  openPlaceInfo: (item: Place | Portal, type: OverlayType, onSelectItem?: SelectDestinationHandler) => void;
  closeOverlay: () => void;
  openMarket: (onSelectItem?: SelectDestinationHandler) => void;
  closeMarket: () => void;
  openFormOverlay: (mode: 'add' | 'edit', initialData?: (InitialPlaceData & { type: 'place' }) | (InitialPortalData & { type: 'portal' })) => void;
}

const OverlayContext = createContext<OverlayContextValue | null>(null);

export function useOverlay() {
  const ctx = useContext(OverlayContext);
  if (!ctx) throw new Error('useOverlay must be used within OverlayProvider');
  return ctx;
}

interface MarketState {
  isOpen: boolean;
  isClosing: boolean;
  onSelectItem?: SelectDestinationHandler;
}

export const OverlayProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<OverlayState>({ isOpen: false, item: null, type: 'place', onSelectItem: undefined });
  const [infoClosing, setInfoClosing] = useState(false);
  const [marketState, setMarketState] = useState<MarketState>({ isOpen: false, isClosing: false, onSelectItem: undefined });
  const [formOverlayState, setFormOverlayState] = useState<FormOverlayState>({ isOpen: false, isClosing: false, mode: 'add' });
  const formOverlayTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (formOverlayTimeoutRef.current) {
        clearTimeout(formOverlayTimeoutRef.current);
      }
    };
  }, []);

  const openPlaceInfoById = async (placeId: string, onSelectItem?: SelectDestinationHandler) => {
    try {
      const res = await fetch('/api/places');
      if (!res.ok) return;
      const places: Place[] = await res.json();
      const place = places.find((p) => p.id === placeId);
      if (place) {
        setState({ isOpen: true, item: place, type: 'place', onSelectItem });
      }
    } catch {
      /* ignore */
    }
  };

  const openPlaceInfo = (item: Place | Portal, type: OverlayType, onSelectItem?: SelectDestinationHandler) => {
    setState({ isOpen: true, item, type, onSelectItem });
  };

  const closeOverlay = () => {
    setInfoClosing(true);
    setTimeout(() => {
      setState(prev => ({ ...prev, isOpen: false }));
      setInfoClosing(false);
    }, 300);
  };

  const openMarket = (onSelectItem?: SelectDestinationHandler) => {
    setMarketState({ isOpen: true, isClosing: false, onSelectItem });
  };
  const closeMarket = () => {
    setMarketState(prev => ({ ...prev, isClosing: true }));
    setTimeout(() => {
      setMarketState(prev => ({ ...prev, isOpen: false, isClosing: false }));
    }, 300);
  };

  const openFormOverlay = (mode: 'add' | 'edit', initialData?: (InitialPlaceData & { type: 'place' }) | (InitialPortalData & { type: 'portal' })) => {
    setFormOverlayState({ isOpen: true, isClosing: false, mode, initialData });
  };

  const handleFormSaved = (entityType: 'place' | 'portal', payload: PlaceFormPayload | PortalFormPayload) => {
    if (entityType !== 'place' || formOverlayState.mode !== 'edit' || formOverlayState.initialData?.type !== 'place') {
      return;
    }

    const placePayload = payload as PlaceFormPayload;
    setState((prev) => {
      if (prev.type !== 'place' || !prev.item || prev.item.id !== formOverlayState.initialData?.id) {
        return prev;
      }

      return {
        ...prev,
        item: {
          ...prev.item,
          id: placePayload.slug,
          name: placePayload.name,
          world: placePayload.world,
          coordinates: placePayload.coordinates,
          description: placePayload.description,
          address: placePayload.address,
          category: placePayload.category,
          owners: placePayload.owners,
          tags: placePayload.tags,
          discord: placePayload.discordUrl,
          images: placePayload.images,
        } satisfies Place,
      };
    });
  };

  const closeFormOverlay = () => {
    setFormOverlayState(prev => ({ ...prev, isClosing: true }));
    if (formOverlayTimeoutRef.current) {
      clearTimeout(formOverlayTimeoutRef.current);
    }
    formOverlayTimeoutRef.current = setTimeout(() => {
      setFormOverlayState({ isOpen: false, isClosing: false, mode: 'add' });
    }, 300);
  };

  return (
    <OverlayContext.Provider value={{ openPlaceInfoById, openPlaceInfo, closeOverlay, openMarket, closeMarket, openFormOverlay }}>
      {children}
      {/* Info overlay wrapped with shared Overlay to unify fade behavior */}
      {state.isOpen && (
        <Overlay isOpen={state.isOpen} onClose={closeOverlay} closing={infoClosing}>
          <InfoOverlay
            isOpen={state.isOpen}
            onClose={closeOverlay}
            item={state.item}
            type={state.type}
            onSelectItem={state.onSelectItem}
            withinOverlay
            closing={infoClosing}
          />
        </Overlay>
      )}
      {marketState.isOpen && (
        <Overlay isOpen={marketState.isOpen} onClose={closeMarket}>
          <GlobalTradeOverlay onClose={closeMarket} closing={marketState.isClosing} onSelectItem={marketState.onSelectItem} />
        </Overlay>
      )}
      {formOverlayState.isOpen && (
        <Overlay isOpen={formOverlayState.isOpen} onClose={closeFormOverlay} closing={formOverlayState.isClosing}>
          <FormOverlay
            mode={formOverlayState.mode}
            initialData={formOverlayState.initialData as (InitialPlaceData | InitialPortalData)}
            onClose={closeFormOverlay}
            onSaved={handleFormSaved}
            closing={formOverlayState.isClosing}
          />
        </Overlay>
      )}
    </OverlayContext.Provider>
  );
};
