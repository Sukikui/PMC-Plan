'use client';

import { useQueryClient } from '@tanstack/react-query';
import ArrowRightIcon from '@/components/icons/ArrowRightIcon';
import { useOverlay } from '@/components/overlay/OverlayProvider';
import SpaceLogo from '@/components/spaces/SpaceLogo';
import {
  FloatingStatusBubblePresence,
  getFloatingStatusBubbleClassName,
  useFloatingStatusBubblePresence,
} from '@/components/ui/FloatingStatusBubble';
import { spaceDetailQueryOptions } from '@/lib/spaces/client';
import type { SpaceReference } from '@/lib/spaces/types';
import { themeColors } from '@/lib/theme-colors';
import { MAP_STATUS_BUBBLE_Z_INDEX } from '../core/map-constants';

interface MapDominantSpaceIndicatorProps {
  space: SpaceReference | null;
}

export default function MapDominantSpaceIndicator({ space }: MapDominantSpaceIndicatorProps) {
  const queryClient = useQueryClient();
  const { openSpaceInfo } = useOverlay();
  const { displayedValue: displayedSpace, visible } = useFloatingStatusBubblePresence(space);
  const prefetchSpace = () => {
    if (displayedSpace) {
      void queryClient.prefetchQuery(spaceDetailQueryOptions(displayedSpace.slug));
    }
  };

  return (
    <FloatingStatusBubblePresence
      visible={visible}
      className="pointer-events-none absolute left-1/2 top-4 max-w-[calc(100%-2rem)] -translate-x-1/2"
      style={{ zIndex: MAP_STATUS_BUBBLE_Z_INDEX }}
    >
      {displayedSpace && <button
        aria-label={`Ouvrir l'espace ${displayedSpace.name}`}
        className={getFloatingStatusBubbleClassName({
          className: `group pointer-events-auto flex h-10 min-w-0 cursor-pointer items-center py-1 pl-1 pr-3 ${themeColors.interactive.hoverPanel} ${themeColors.interactive.focusRing}`,
        })}
        disabled={!visible}
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          openSpaceInfo(displayedSpace);
        }}
        onFocus={prefetchSpace}
        onPointerDown={(event) => {
          event.stopPropagation();
          prefetchSpace();
        }}
        onPointerEnter={prefetchSpace}
      >
        <SpaceLogo
          color={displayedSpace.color}
          logoBackground={displayedSpace.logoBackground}
          logoUrl={displayedSpace.logoUrl}
          logoZoom={displayedSpace.logoZoom}
          name={displayedSpace.name}
          size="compact"
        />
        <span className={`ml-2 min-w-0 truncate text-sm font-medium ${themeColors.text.primary} ${themeColors.interactive.groupHoverAccentText} ${themeColors.transition}`}>
          {displayedSpace.name}
        </span>
        <span
          aria-hidden="true"
          className="inline-flex max-w-0 shrink-0 overflow-hidden opacity-0 transition-[max-width,margin-left,opacity] duration-200 ease-out group-hover:ml-1.5 group-hover:max-w-4 group-hover:opacity-100 group-focus-visible:ml-1.5 group-focus-visible:max-w-4 group-focus-visible:opacity-100"
        >
          <ArrowRightIcon
            className={`h-4 w-4 shrink-0 ${themeColors.text.tertiary} ${themeColors.interactive.groupHoverAccentText}`}
          />
        </span>
      </button>}
    </FloatingStatusBubblePresence>
  );
}
