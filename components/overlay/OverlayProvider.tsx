'use client';

import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Overlay from '@/components/ui/Overlay';
import type { OpenFormOverlayOptions } from '@/components/form/FormOverlay';
import { useInfoOverlayStack } from '@/components/overlay/useInfoOverlayStack';
import type { Place, Portal } from '@/lib/api/types';
import type { Space } from '@/lib/spaces/types';
import type { Service } from '@/lib/services/types';
import type { SelectDestinationHandler } from '@/lib/destination/selection';
import {
  loadPlacesData,
  loadPortalsData,
  subscribeToMapEntryManagementUpdates,
} from '@/lib/preload/main-screen';
import { fetchSpace } from '@/lib/spaces/client';
import { OVERLAY_TRANSITION_MS } from '@/lib/ui/overlay';
import {
  loadFormOverlay,
  loadInfoOverlayStack,
} from '@/lib/preload/overlay-modules';

const FormOverlay = dynamic(loadFormOverlay);
const InfoOverlayStack = dynamic(loadInfoOverlayStack);

type MapEntryOverlayType = 'place' | 'portal';
interface FormOverlayState {
  isOpen: boolean;
  isClosing: boolean;
  options: OpenFormOverlayOptions;
}

interface OverlayContextValue {
  openPlaceInfoById: (placeId: string, onSelectItem?: SelectDestinationHandler) => Promise<void>;
  openMapEntryInfoById: (
    mapEntryId: string,
    type: MapEntryOverlayType,
    onSelectItem?: SelectDestinationHandler,
  ) => Promise<void>;
  openPlaceInfo: (item: Place | Portal, type: MapEntryOverlayType, onSelectItem?: SelectDestinationHandler) => void;
  openSpaceInfo: (space: Space) => void;
  openSpaceInfoBySlug: (slug: string) => Promise<void>;
  openServiceEditor: (service: Service, canDelete: boolean) => void;
  closeOverlay: () => void;
  openFormOverlay: (options: OpenFormOverlayOptions) => void;
}

const OverlayContext = createContext<OverlayContextValue | null>(null);

export function useOverlay() {
  const ctx = useContext(OverlayContext);
  if (!ctx) throw new Error('useOverlay must be used within OverlayProvider');
  return ctx;
}

type TimeoutRef = React.MutableRefObject<ReturnType<typeof setTimeout> | null>;

function clearScheduledClose(timeoutRef: TimeoutRef) {
  if (!timeoutRef.current) return;
  clearTimeout(timeoutRef.current);
  timeoutRef.current = null;
}

export const OverlayProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const infoStack = useInfoOverlayStack();
  const { applyManagementUpdate } = infoStack;
  const [formOverlayState, setFormOverlayState] = useState<FormOverlayState>({
    isOpen: false,
    isClosing: false,
    options: { mode: 'add' },
  });
  const formTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      clearScheduledClose(formTimeoutRef);
    };
  }, []);

  useEffect(() => subscribeToMapEntryManagementUpdates((management) => {
    applyManagementUpdate(management);
  }), [applyManagementUpdate]);

  const openPlaceInfoById = async (placeId: string, onSelectItem?: SelectDestinationHandler) => {
    try {
      const place = (await loadPlacesData()).find((item) => item.id === placeId);
      if (place) infoStack.open(place, 'place', onSelectItem);
    } catch {
      /* ignore */
    }
  };

  const openPlaceInfo = (item: Place | Portal, type: MapEntryOverlayType, onSelectItem?: SelectDestinationHandler) => {
    infoStack.open(item, type, onSelectItem);
  };

  const openSpaceInfo = (space: Space) => {
    infoStack.open(space, 'space');
  };

  const openSpaceInfoBySlug = async (slug: string) => {
    try {
      openSpaceInfo(await fetchSpace(slug));
    } catch {
      // The source overlay remains usable if the space cannot be loaded.
    }
  };

  const openServiceEditor = (service: Service, canDelete: boolean) => {
    openFormOverlay({
      initialData: {
        ...service,
        canDelete,
        type: 'service',
      },
      mode: 'edit',
    });
  };

  const openMapEntryInfoById = async (
    mapEntryId: string,
    type: MapEntryOverlayType,
    onSelectItem?: SelectDestinationHandler,
  ) => {
    const item = type === 'place'
      ? (await loadPlacesData()).find((entry) => entry.mapEntryId === mapEntryId)
      : (await loadPortalsData({ mergeNetherPortals: true }))
        .find((entry) => entry.mapEntryId === mapEntryId);
    if (item) openPlaceInfo(item, type, onSelectItem);
  };

  const closeOverlay = infoStack.closeTop;

  const openFormOverlay = (options: OpenFormOverlayOptions) => {
    clearScheduledClose(formTimeoutRef);
    setFormOverlayState({ isOpen: true, isClosing: false, options });
  };

  const handleFormSaved = async (
    entityType: 'place' | 'portal',
  ) => {
    const initialData = formOverlayState.options.initialData;
    if (
      formOverlayState.options.mode !== 'edit'
      || !initialData
      || initialData.type !== entityType
    ) {
      return;
    }

    try {
      const updatedItem = entityType === 'place'
        ? (await loadPlacesData()).find(
          ({ mapEntryId }) => mapEntryId === initialData.mapEntryId,
        )
        : (await loadPortalsData({ mergeNetherPortals: true })).find(
          ({ mapEntryId }) => mapEntryId === initialData.mapEntryId,
        );
      if (!updatedItem) return;

      infoStack.updateMapEntry(updatedItem, entityType);
    } catch {
      // The save succeeded; other subscribers can retry the shared data refresh.
    }
  };

  const handleSpaceSaved = (space: Space) => {
    formOverlayState.options.onSpaceSaved?.(space);
    infoStack.updateSpace(space);
  };

  const handleSpaceDeleted = (space: Space) => {
    infoStack.removeSpace(space.id);
  };

  const closeFormOverlay = () => {
    setFormOverlayState(prev => ({ ...prev, isClosing: true }));
    clearScheduledClose(formTimeoutRef);
    formTimeoutRef.current = setTimeout(() => {
      formTimeoutRef.current = null;
      setFormOverlayState({
        isOpen: false,
        isClosing: false,
        options: { mode: 'add' },
      });
    }, OVERLAY_TRANSITION_MS);
  };

  return (
    <OverlayContext.Provider value={{ openPlaceInfoById, openMapEntryInfoById, openPlaceInfo, openSpaceInfo, openSpaceInfoBySlug, openServiceEditor, closeOverlay, openFormOverlay }}>
      {children}
      {infoStack.layers.length > 0 && (
        <InfoOverlayStack
          layers={infoStack.layers}
          onClose={infoStack.close}
        />
      )}
      {formOverlayState.isOpen && (
        <Overlay isOpen={formOverlayState.isOpen} onClose={closeFormOverlay} closing={formOverlayState.isClosing}>
          <FormOverlay
            {...formOverlayState.options}
            onClose={closeFormOverlay}
            onSaved={handleFormSaved}
            onSpaceDeleted={handleSpaceDeleted}
            onSpaceSaved={handleSpaceSaved}
          />
        </Overlay>
      )}
    </OverlayContext.Provider>
  );
};
