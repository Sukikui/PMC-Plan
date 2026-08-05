'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useAdminMode } from '@/components/admin/AdminModeProvider';
import ContentOverlayFrame from '@/components/overlay/ContentOverlayFrame';
import ProgressiveOverlayBody from '@/components/overlay/ProgressiveOverlayBody';
import ContentInfoOverlayHeader from '@/components/info-overlay/ContentInfoOverlayHeader';
import { useBottomScrollFade } from '@/components/info-overlay/useBottomScrollFade';
import { useOverlay } from '@/components/overlay/OverlayProvider';
import { canManageContent } from '@/lib/content-permissions';
import type { Space, SpaceReference, SpaceSummary } from '@/lib/spaces/types';
import { spaceDetailQueryOptions } from '@/lib/spaces/client';
import { themeColors } from '@/lib/theme-colors';
import SpaceInfoContent, { type SpaceInfoTab } from './SpaceInfoContent';
import SpaceLogo from './SpaceLogo';

interface SpaceInfoOverlayProps {
  onClose: () => void;
  space: Space | SpaceReference | SpaceSummary;
}

export default function SpaceInfoOverlay({
  onClose,
  space,
}: SpaceInfoOverlayProps) {
  const { data: session } = useSession();
  const { effectiveRole } = useAdminMode();
  const { openFormOverlay, openMapEntryInfoById } = useOverlay();
  const detailQuery = useQuery({
    ...spaceDetailQueryOptions(space.slug),
    initialData: isSpaceDetail(space) ? space : undefined,
  });
  const detail = detailQuery.data;
  const displaySpace = detail ?? space;
  const [activeTab, setActiveTab] = useState<SpaceInfoTab>('information');
  const { contentRef, showBottomBlur } = useBottomScrollFade(
    [
      activeTab,
      space.id,
      detail?.images.length ?? 0,
      detail?.members.length ?? 0,
      detail?.places.length ?? 0,
      detail?.portals.length ?? 0,
    ].join(':'),
  );
  const canEdit = detail ? canManageContent(
    effectiveRole,
    session?.user?.id,
    detail,
  ) : false;

  useEffect(() => setActiveTab('information'), [space.id]);

  return (
    <ContentOverlayFrame
      ariaLabel={displaySpace.name}
      editor={detail?.lastEditor}
      header={(
        <ContentInfoOverlayHeader
          canEdit={canEdit}
          discordUrl={displaySpace.discordUrl}
          identity={(
            <SpaceLogo
              color={displaySpace.color}
              logoBackground={displaySpace.logoBackground}
              logoUrl={displaySpace.logoUrl}
              logoZoom={displaySpace.logoZoom}
              name={displaySpace.name}
              size="overlay"
            />
          )}
          metadata={(
            <p className={`text-sm ${themeColors.text.tertiary}`}>
              #{displaySpace.slug}
            </p>
          )}
          metadataUnderTitle
          onClose={onClose}
          onEdit={() => detail && openFormOverlay({
            initialData: { ...detail, type: 'space' },
            mode: 'edit',
          })}
          title={displaySpace.name}
        />
      )}
      shadowClass={themeColors.shadow.overlay.place}
      showLastEditor={canEdit}
    >
      <ProgressiveOverlayBody
        error={detailQuery.error?.message}
        loading={detailQuery.isPending}
        onRetry={() => void detailQuery.refetch()}
      >
        {detail && (
          <SpaceInfoContent
            activeTab={activeTab}
            contentRef={contentRef}
            onOpenContent={(mapEntryId, type) => (
              void openMapEntryInfoById(mapEntryId, type)
            )}
            onTabChange={setActiveTab}
            showBottomBlur={showBottomBlur}
            space={detail}
          />
        )}
      </ProgressiveOverlayBody>
    </ContentOverlayFrame>
  );
}

function isSpaceDetail(
  space: Space | SpaceReference | SpaceSummary,
): space is Space {
  return 'places' in space;
}
