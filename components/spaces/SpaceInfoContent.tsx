'use client';

import type React from 'react';
import InfoDescriptionSection from '@/components/info-overlay/InfoDescriptionSection';
import InfoImageCarousel from '@/components/info-overlay/InfoImageCarousel';
import InfoOverlayBody from '@/components/info-overlay/InfoOverlayBody';
import MinecraftProfileList from '@/components/info-overlay/MinecraftProfileList';
import { OverlaySlideTrack } from '@/components/ui/OverlaySlider';
import OverlayTabs from '@/components/ui/OverlayTabs';
import type { Space } from '@/lib/spaces/types';
import { themeColors } from '@/lib/theme-colors';
import SpaceContentList from './SpaceContentList';

export type SpaceInfoTab = 'information' | 'places' | 'portals';

interface SpaceInfoContentProps {
  activeTab: SpaceInfoTab;
  contentRef: React.RefObject<HTMLDivElement | null>;
  onOpenContent: (
    mapEntryId: string,
    type: 'place' | 'portal',
  ) => void;
  onTabChange: (tab: SpaceInfoTab) => void;
  showBottomBlur: boolean;
  space: Space;
}

export default function SpaceInfoContent({
  activeTab,
  contentRef,
  onOpenContent,
  onTabChange,
  showBottomBlur,
  space,
}: SpaceInfoContentProps) {
  return (
    <InfoOverlayBody
      floatingContent={(
        <OverlayTabs
          activeValue={activeTab}
          onChange={onTabChange}
          options={spaceInfoTabs}
          showGradient={false}
        />
      )}
      showBottomBlur={showBottomBlur}
    >
      <OverlaySlideTrack
        activeValue={activeTab}
        baseSlideClassName={`h-full overflow-y-auto rounded-b-xl px-6 pb-12 pt-[4.5rem] ${themeColors.panel.primary} ${themeColors.transition} [&::-webkit-scrollbar]:hidden [scrollbar-width:none]`}
        slides={[
          {
            value: 'information',
            elementRef: activeTab === 'information' ? contentRef : undefined,
            className: 'space-y-6',
            content: (
              <>
                <InfoImageCarousel
                  carouselId={space.id}
                  images={space.images.map((image) => ({
                    id: image.id,
                    src: image.url,
                    alt: `Image de ${image.placeName}`,
                    caption: image.placeName,
                  }))}
                />
                <MinecraftProfileList
                  pluralTitle="Membres"
                  profiles={space.members}
                  singularTitle="Membre"
                />
                <InfoDescriptionSection
                  description={space.description}
                  preserveWhitespace
                />
              </>
            ),
          },
          {
            value: 'places',
            elementRef: activeTab === 'places' ? contentRef : undefined,
            content: (
              <SpaceContentList
                items={space.places}
                type="place"
                onOpen={(mapEntryId) => (
                  onOpenContent(mapEntryId, 'place')
                )}
              />
            ),
          },
          {
            value: 'portals',
            elementRef: activeTab === 'portals' ? contentRef : undefined,
            content: (
              <SpaceContentList
                items={space.portals}
                type="portal"
                onOpen={(mapEntryId) => (
                  onOpenContent(mapEntryId, 'portal')
                )}
              />
            ),
          },
        ]}
      />
    </InfoOverlayBody>
  );
}

const spaceInfoTabs = [
  { label: 'Informations', value: 'information' },
  { label: 'Lieux', value: 'places' },
  { label: 'Portails', value: 'portals' },
] as const;
