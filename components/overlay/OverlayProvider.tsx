'use client';

import React, { createContext, useCallback, useContext, useState, useRef, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import Overlay from '@/components/ui/Overlay';
import { useOverlayStackActions } from '@/components/ui/OverlayStackProvider';
import type { OpenFormOverlayOptions } from '@/components/form/FormOverlay';
import { useInfoOverlayStack } from '@/components/overlay/useInfoOverlayStack';
import type { Place, Portal } from '@/lib/api/types';
import type { Space, SpaceReference, SpaceSummary } from '@/lib/spaces/types';
import type { PlaceSummary, PortalSummary } from '@/lib/map-content/types';
import type { Service } from '@/lib/services/types';
import type { SelectDestinationHandler } from '@/lib/destination/selection';
import {
  subscribeToMapEntryManagementUpdates,
} from '@/lib/map-entry/client-updates';
import {
  findMapEntrySummary,
  mapContentQueryOptions,
  mapEntryDetailQueryOptions,
} from '@/lib/map-content/client';
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
  openPlaceInfoById: (placeId: string) => Promise<void>;
  openMapEntryInfoById: (
    mapEntryId: string,
    type: MapEntryOverlayType,
  ) => Promise<void>;
  openPlaceInfo: (item: Place | Portal | PlaceSummary | PortalSummary, type: MapEntryOverlayType) => void;
  openSpaceInfo: (space: Space | SpaceReference | SpaceSummary) => void;
  openServiceEditor: (service: Service, canDelete: boolean) => void;
  closeOverlay: () => void;
  openFormOverlay: (options: OpenFormOverlayOptions) => void;
  navigateToDestination: SelectDestinationHandler;
  registerDestinationHandler: (handler: SelectDestinationHandler) => () => void;
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
  const queryClient = useQueryClient();
  const { closeAll } = useOverlayStackActions();
  const infoStack = useInfoOverlayStack();
  const { applyManagementUpdate } = infoStack;
  const [formOverlayState, setFormOverlayState] = useState<FormOverlayState>({
    isOpen: false,
    isClosing: false,
    options: { mode: 'add' },
  });
  const formTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const destinationHandlerRef = useRef<SelectDestinationHandler | null>(null);

  useEffect(() => {
    return () => {
      clearScheduledClose(formTimeoutRef);
    };
  }, []);

  useEffect(() => subscribeToMapEntryManagementUpdates((management) => {
    applyManagementUpdate(management);
  }), [applyManagementUpdate]);

  const registerDestinationHandler = useCallback((handler: SelectDestinationHandler) => {
    destinationHandlerRef.current = handler;
    return () => {
      if (destinationHandlerRef.current === handler) {
        destinationHandlerRef.current = null;
      }
    };
  }, []);

  const navigateToDestination = useCallback<SelectDestinationHandler>((id, type, world) => {
    destinationHandlerRef.current?.(id, type, world);
    closeAll();
  }, [closeAll]);

  const openPlaceInfoById = async (placeId: string) => {
    try {
      const data = await queryClient.ensureQueryData(mapContentQueryOptions);
      const place = data.places.find((item) => item.id === placeId);
      if (place) infoStack.open(place, 'place');
    } catch {
      /* ignore */
    }
  };

  const openPlaceInfo = (item: Place | Portal | PlaceSummary | PortalSummary, type: MapEntryOverlayType) => {
    infoStack.open(item, type);
  };

  const openSpaceInfo = (space: Space | SpaceReference | SpaceSummary) => {
    infoStack.open(space, 'space');
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
  ) => {
    const data = await queryClient.ensureQueryData(mapContentQueryOptions);
    const item = findMapEntrySummary(data, mapEntryId, type);
    if (item) openPlaceInfo(item, type);
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
      || !initialData.mapEntryId
    ) {
      return;
    }

    try {
      const detailOptions = mapEntryDetailQueryOptions(
        entityType,
        initialData.mapEntryId,
      );
      const updatedItem = await queryClient.fetchQuery(detailOptions);
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
    <OverlayContext.Provider value={{ closeOverlay, navigateToDestination, openFormOverlay, openMapEntryInfoById, openPlaceInfo, openPlaceInfoById, openServiceEditor, openSpaceInfo, registerDestinationHandler }}>
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
