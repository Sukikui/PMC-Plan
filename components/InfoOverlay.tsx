'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import AdminCreatorInfo from '@/components/admin/AdminCreatorInfo';
import { useOverlay } from '@/components/overlay/OverlayProvider';
import Overlay from '@/components/ui/Overlay';
import { useOverlayPanelAnimation } from '@/components/ui/useOverlayPanelAnimation';
import InfoOverlayContent from '@/components/info-overlay/InfoOverlayContent';
import InfoOverlayHeader from '@/components/info-overlay/InfoOverlayHeader';
import type { Place, Portal } from '@/app/api/utils/shared';
import { generateFormId } from '@/components/form/common/form-utils';
import {
  DEFAULT_PLACE_CATEGORY,
  isPlaceCategory,
  type MapIconCategory,
} from '@/lib/place/categories';
import { themeColors } from '@/lib/theme-colors';
import { toMapWorld, type SelectDestinationHandler } from '@/lib/destination/selection';

interface InfoOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  item: Place | Portal | null;
  type: 'place' | 'portal';
  onSelectItem?: SelectDestinationHandler;
  withinOverlay?: boolean;
  closing?: boolean;
}

export default function InfoOverlay({
  isOpen,
  onClose,
  item,
  type,
  onSelectItem,
  withinOverlay = false,
  closing = false,
}: InfoOverlayProps) {
  const { data: session } = useSession();
  const { openFormOverlay } = useOverlay();
  const [showOwnerTooltip, setShowOwnerTooltip] = useState(false);
  const [showTradeView, setShowTradeView] = useState(false);
  const [tradeSearchQuery, setTradeSearchQuery] = useState('');
  const [showBottomBlur, setShowBottomBlur] = useState(false);
  const [localClosing, setLocalClosing] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);
  const effectiveClosing = withinOverlay ? closing : localClosing;
  const animIn = useOverlayPanelAnimation(isOpen || effectiveClosing, { closing: effectiveClosing });

  const handleClose = useCallback(() => {
    if (withinOverlay) {
      onClose();
      return;
    }

    if (localClosing) return;

    setLocalClosing(true);
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
    }
    closeTimeoutRef.current = setTimeout(() => {
      closeTimeoutRef.current = null;
      onClose();
      if (isMountedRef.current) {
        setLocalClosing(false);
      }
    }, 300);
  }, [withinOverlay, onClose, localClosing]);

  const handleEditClick = () => {
    if (!item) return;

    if (type === 'place') {
      const place = item as Place;
      openFormOverlay('edit', {
        type: 'place',
        name: place.name,
        id: place.id,
        world: place.world as 'overworld' | 'nether',
        category: place.category,
        coordinates: place.coordinates,
        owners: place.owners,
        tags: place.tags,
        description: place.description ?? undefined,
        address: place.address ?? undefined,
        discord: place.discord ?? undefined,
        images: place.images,
        trade: place.trade?.map((tradeOffer) => ({
          ...tradeOffer,
          id: generateFormId(),
          negotiable: tradeOffer.negotiable ?? false,
          gives: {
            ...tradeOffer.gives,
            quantity: String(tradeOffer.gives.quantity),
            custom_name: tradeOffer.gives.custom_name ?? null,
          },
          wants: {
            ...tradeOffer.wants,
            quantity: String(tradeOffer.wants.quantity),
            custom_name: tradeOffer.wants.custom_name ?? null,
          },
        })) ?? undefined,
      });
      return;
    }

    const portal = item as Portal;
    openFormOverlay('edit', {
      type: 'portal',
      variant: portal['nether-associate'] ? 'linked' : portal.world as 'overworld' | 'nether',
      name: portal.name,
      id: portal.id,
      owners: portal.owners,
      coordinates: portal['nether-associate'] ? undefined : portal.coordinates,
      address: portal.world === 'nether' && !portal['nether-associate'] ? portal.address : undefined,
      overworldCoordinates: portal['nether-associate'] ? portal.coordinates : undefined,
      netherCoordinates: portal['nether-associate']?.coordinates,
      description: portal.description ?? undefined,
      netherAddress: portal['nether-associate']?.address,
    });
  };

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, handleClose]);

  useEffect(() => {
    if (!isOpen) {
      setShowTradeView(false);
    }
  }, [isOpen, item]);

  useEffect(() => {
    const contentElement = contentRef.current;
    if (!contentElement) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = contentElement;
      setShowBottomBlur(scrollTop + clientHeight < scrollHeight - 10);
    };

    handleScroll();
    contentElement.addEventListener('scroll', handleScroll);
    return () => contentElement.removeEventListener('scroll', handleScroll);
  }, [showTradeView, isOpen, item]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!withinOverlay && isOpen) {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
        closeTimeoutRef.current = null;
      }
      setLocalClosing(false);
    }
  }, [isOpen, withinOverlay]);

  if ((!isOpen && !effectiveClosing) || !item) return null;

  const placeItem = type === 'place' ? item as Place : null;
  const primaryOwner = placeItem?.owners?.[0] ?? null;
  const additionalOwners = placeItem?.owners?.slice(1) ?? [];
  const canEdit = session?.user?.role === 'admin' || session?.user?.id === item.createdById;
  const itemNetherAddress = item.world === 'nether' ? item.address : null;
  const iconCategory: MapIconCategory = type === 'portal'
    ? 'portail'
    : isPlaceCategory((item as Place).category)
      ? (item as Place).category
      : DEFAULT_PLACE_CATEGORY;
  const typeShadow = type === 'place'
    ? themeColors.shadow.overlay.place
    : themeColors.shadow.overlay.portal;

  const panel = (
    <div
      className={`relative ${themeColors.panel.primary} ${themeColors.blur} ${themeColors.util.roundedXl} [box-shadow:0_0_25px_0_var(--tw-shadow-color)] ${typeShadow} w-full max-w-2xl min-w-0 h-[min(90vh,calc(100vh-4rem))] border ${themeColors.border.primary} flex flex-col transition-all duration-300 ease-out`}
      style={{
        width: 'min(42rem, calc(100vw - 2rem))',
        transform: animIn ? 'translateY(0)' : 'translateY(100%)',
        opacity: animIn ? 1 : 0,
      }}
    >
      <InfoOverlayHeader
        additionalOwners={additionalOwners}
        canEdit={canEdit}
        iconCategory={iconCategory}
        item={item}
        itemNetherAddress={itemNetherAddress}
        primaryOwner={primaryOwner}
        showOwnerTooltip={showOwnerTooltip}
        type={type}
        onClose={handleClose}
        onEdit={handleEditClick}
        onOwnerTooltipChange={setShowOwnerTooltip}
        onSelectItem={() => {
          onSelectItem?.(item.id, type, toMapWorld(item.world));
          handleClose();
        }}
      />
      <AdminCreatorInfo createdById={item.createdById} createdAt={item.createdAt} updatedAt={item.updatedAt} />
      <InfoOverlayContent
        contentRef={contentRef}
        item={item}
        showBottomBlur={showBottomBlur}
        showTradeView={showTradeView}
        tradeSearchQuery={tradeSearchQuery}
        type={type}
        onShowTradeViewChange={setShowTradeView}
        onTradeSearchQueryChange={setTradeSearchQuery}
      />
    </div>
  );

  if (withinOverlay) {
    return panel;
  }

  return (
    <Overlay isOpen={isOpen} onClose={handleClose} closing={effectiveClosing}>
      {panel}
    </Overlay>
  );
}
