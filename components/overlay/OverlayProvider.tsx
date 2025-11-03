'use client';

import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import InfoOverlay from '@/components/InfoOverlay';
import Overlay from '@/components/ui/Overlay';
import GlobalTradeOverlay from '@/components/GlobalTradeOverlay';
import FormOverlay from '@/components/form/FormOverlay';
import type { Place, Portal } from '@/app/api/utils/shared';

type OverlayType = 'place' | 'portal';

interface OverlayState {
  isOpen: boolean;
  item: Place | Portal | null;
  type: OverlayType;
  onSelectItem?: (id: string, type: OverlayType) => void;
}

interface FormOverlayState {
  isOpen: boolean;
  isClosing: boolean;
  mode: 'add' | 'edit';
  initialData?: any;
}

interface OverlayContextValue {
  openPlaceInfoById: (placeId: string, onSelectItem?: (id: string, type: OverlayType) => void) => Promise<void>;
  openPlaceInfo: (item: Place | Portal, type: OverlayType, onSelectItem?: (id: string, type: OverlayType) => void) => void;
  closeOverlay: () => void;
  openMarket: (onSelectItem?: (id: string, type: OverlayType) => void) => void;
  closeMarket: () => void;
  openFormOverlay: (mode: 'add' | 'edit', initialData?: any) => void;
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
  onSelectItem?: (id: string, type: OverlayType) => void;
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

  const openPlaceInfoById = async (placeId: string, onSelectItem?: (id: string, type: OverlayType) => void) => {
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

  const openPlaceInfo = (item: Place | Portal, type: OverlayType, onSelectItem?: (id: string, type: OverlayType) => void) => {
    setState({ isOpen: true, item, type, onSelectItem });
  };

  const closeOverlay = () => {
    setInfoClosing(true);
    setTimeout(() => {
      setState(prev => ({ ...prev, isOpen: false }));
      setInfoClosing(false);
    }, 300);
  };

  const openMarket = (onSelectItem?: (id: string, type: OverlayType) => void) => {
    setMarketState({ isOpen: true, isClosing: false, onSelectItem });
  };
  const closeMarket = () => {
    setMarketState(prev => ({ ...prev, isClosing: true }));
    setTimeout(() => {
      setMarketState(prev => ({ ...prev, isOpen: false, isClosing: false }));
    }, 300);
  };

  const openFormOverlay = (mode: 'add' | 'edit', initialData?: any) => {
    setFormOverlayState({ isOpen: true, isClosing: false, mode, initialData });
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
          <FormOverlay mode={formOverlayState.mode} initialData={formOverlayState.initialData} onClose={closeFormOverlay} closing={formOverlayState.isClosing} />
        </Overlay>
      )}
    </OverlayContext.Provider>
  );
};