'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useAdminMode } from '@/components/admin/AdminModeProvider';
import ContentOverlayFrame from '@/components/overlay/ContentOverlayFrame';
import ContentInfoOverlayHeader from '@/components/info-overlay/ContentInfoOverlayHeader';
import { useBottomScrollFade } from '@/components/info-overlay/useBottomScrollFade';
import { useOverlay } from '@/components/overlay/OverlayProvider';
import { canManageContent } from '@/lib/content-permissions';
import type { Space } from '@/lib/spaces/types';
import { themeColors } from '@/lib/theme-colors';
import SpaceInfoContent, { type SpaceInfoTab } from './SpaceInfoContent';
import SpaceLogo from './SpaceLogo';

interface SpaceInfoOverlayProps {
  onClose: () => void;
  space: Space;
}

export default function SpaceInfoOverlay({
  onClose,
  space,
}: SpaceInfoOverlayProps) {
  const { data: session } = useSession();
  const { effectiveRole } = useAdminMode();
  const { openFormOverlay, openMapEntryInfoById } = useOverlay();
  const [activeTab, setActiveTab] = useState<SpaceInfoTab>('information');
  const { contentRef, showBottomBlur } = useBottomScrollFade(
    [
      activeTab,
      space.id,
      space.images.length,
      space.members.length,
      space.places.length,
      space.portals.length,
    ].join(':'),
  );
  const canEdit = canManageContent(
    effectiveRole,
    session?.user?.id,
    space,
  );

  useEffect(() => setActiveTab('information'), [space.id]);

  return (
    <ContentOverlayFrame
      ariaLabel={space.name}
      editor={space.lastEditor}
      header={(
        <ContentInfoOverlayHeader
          canEdit={canEdit}
          discordUrl={space.discordUrl}
          identity={(
            <SpaceLogo
              color={space.color}
              logoBackground={space.logoBackground}
              logoUrl={space.logoUrl}
              logoZoom={space.logoZoom}
              name={space.name}
              size="overlay"
            />
          )}
          metadata={(
            <p className={`text-sm ${themeColors.text.tertiary}`}>
              #{space.slug}
            </p>
          )}
          metadataUnderTitle
          onClose={onClose}
          onEdit={() => openFormOverlay({
            initialData: { ...space, type: 'space' },
            mode: 'edit',
          })}
          title={space.name}
        />
      )}
      shadowClass={themeColors.shadow.overlay.place}
      showLastEditor={canEdit}
    >
      <SpaceInfoContent
        activeTab={activeTab}
        contentRef={contentRef}
        onOpenContent={(mapEntryId, type) => (
          void openMapEntryInfoById(mapEntryId, type)
        )}
        onTabChange={setActiveTab}
        showBottomBlur={showBottomBlur}
        space={space}
      />
    </ContentOverlayFrame>
  );
}
