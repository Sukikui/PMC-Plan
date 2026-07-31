'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useOverlay } from '@/components/overlay/OverlayProvider';
import ContentOverlayFrame from '@/components/overlay/ContentOverlayFrame';
import InfoOverlayContent from '@/components/info-overlay/InfoOverlayContent';
import InfoOverlayHeader from '@/components/info-overlay/InfoOverlayHeader';
import { useBottomScrollFade } from '@/components/info-overlay/useBottomScrollFade';
import type { Place, Portal } from '@/lib/api/types';
import { generateFormId } from '@/components/form/common/form-utils';
import {
  DEFAULT_PLACE_CATEGORY,
  isPlaceCategory,
  type MapIconCategory,
} from '@/lib/place/categories';
import { themeColors } from '@/lib/theme-colors';
import {
  canAdministerContent,
  canManageContent,
} from '@/lib/content-permissions';
import { toMapWorld, type SelectDestinationHandler } from '@/lib/destination/selection';
import { useAdminMode } from '@/components/admin/AdminModeProvider';

interface InfoOverlayProps {
  onClose: () => void;
  item: Place | Portal;
  type: 'place' | 'portal';
  onSelectItem?: SelectDestinationHandler;
}

export default function InfoOverlay({
  onClose,
  item,
  type,
  onSelectItem,
}: InfoOverlayProps) {
  const { data: session } = useSession();
  const { effectiveRole } = useAdminMode();
  const { openFormOverlay, openSpaceInfoBySlug } = useOverlay();
  const [showTradeView, setShowTradeView] = useState(false);
  const [tradeSearchQuery, setTradeSearchQuery] = useState('');
  const { contentRef, showBottomBlur } = useBottomScrollFade(
    `${showTradeView}:${item.id}`,
  );

  const handleEditClick = () => {
    const canDelete = canAdministerContent(
      effectiveRole,
      session?.user?.id,
      item.primaryManagerId,
    );

    if (type === 'place') {
      const place = item as Place;
      openFormOverlay({
        mode: 'edit',
        initialData: {
          type: 'place',
          name: place.name,
          id: place.id,
          world: place.world as 'overworld' | 'nether',
          category: place.category,
          coordinates: place.coordinates,
          canDelete,
          lastEditor: place.lastEditor,
          managerIds: place.managerIds,
          mapEntryId: place.mapEntryId,
          primaryManagerId: place.primaryManagerId,
          tags: place.tags,
          description: place.description ?? undefined,
          address: place.address ?? undefined,
          discord: place.discord ?? undefined,
          discordOverride: place.discordOverride,
          space: place.space,
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
        },
      });
      return;
    }

    const portal = item as Portal;
    openFormOverlay({
      mode: 'edit',
      initialData: {
        type: 'portal',
        variant: portal['nether-associate'] ? 'linked' : portal.world as 'overworld' | 'nether',
        name: portal.name,
        id: portal.id,
        canDelete,
        lastEditor: portal.lastEditor,
        managerIds: portal.managerIds,
        mapEntryId: portal.mapEntryId,
        primaryManagerId: portal.primaryManagerId,
        space: portal.space,
        coordinates: portal['nether-associate'] ? undefined : portal.coordinates,
        address: portal.world === 'nether' && !portal['nether-associate'] ? portal.address : undefined,
        overworldCoordinates: portal['nether-associate'] ? portal.coordinates : undefined,
        netherCoordinates: portal['nether-associate']?.coordinates,
        description: portal.description ?? undefined,
        netherAddress: portal['nether-associate']?.address,
      },
    });
  };

  useEffect(() => {
    setShowTradeView(false);
  }, [item.id]);

  const canEdit = canManageContent(
    effectiveRole,
    session?.user?.id,
    item,
  );
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
    <ContentOverlayFrame
      ariaLabel={item.name}
      editor={item.lastEditor}
      header={(
        <InfoOverlayHeader
          canEdit={canEdit}
          iconCategory={iconCategory}
          item={item}
          itemNetherAddress={itemNetherAddress}
          onOpenSpace={(slug) => void openSpaceInfoBySlug(slug)}
          type={type}
          onClose={onClose}
          onEdit={handleEditClick}
          onSelectItem={() => {
            onSelectItem?.(item.id, type, toMapWorld(item.world));
            onClose();
          }}
        />
      )}
      shadowClass={typeShadow}
      showLastEditor={canEdit}
    >
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
    </ContentOverlayFrame>
  );

  return panel;
}
