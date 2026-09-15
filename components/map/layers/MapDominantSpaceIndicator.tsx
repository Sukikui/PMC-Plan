'use client';

import { useQueryClient } from '@tanstack/react-query';
import ArrowRightIcon from '@/components/icons/ArrowRightIcon';
import { useOverlay } from '@/components/overlay/OverlayProvider';
import SpaceLogo from '@/components/spaces/SpaceLogo';
import {
  FLOATING_STATUS_BUBBLE_FADE_DURATION_MS,
  FloatingStatusBubblePresence,
  getFloatingStatusBubbleClassName,
} from '@/components/ui/FloatingStatusBubble';
import {
  SOFT_VALUE_TRANSITION_DURATION_MS,
  useSoftValueTransition,
} from '@/components/ui/useSoftValueTransition';
import { spaceDetailQueryOptions } from '@/lib/spaces/client';
import type { SpaceReference } from '@/lib/spaces/types';
import { themeColors } from '@/lib/theme-colors';
import { MAP_STATUS_BUBBLE_Z_INDEX } from '../core/map-constants';

interface MapDominantSpaceIndicatorProps {
  interactive?: boolean;
  space: SpaceReference | null;
}

export default function MapDominantSpaceIndicator({
  interactive = true,
  space,
}: MapDominantSpaceIndicatorProps) {
  const queryClient = useQueryClient();
  const { openSpaceInfo } = useOverlay();
  const {
    contentVisible,
    displayedValue: displayedSpace,
    visible,
  } = useSoftValueTransition(space, space?.id ?? null, {
    animateInitial: true,
    retainedDurationMs: FLOATING_STATUS_BUBBLE_FADE_DURATION_MS,
  });
  const prefetchSpace = () => {
    if (interactive && displayedSpace) {
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
        aria-label={interactive
          ? `Ouvrir l'espace ${displayedSpace.name}`
          : `Espace dominant : ${displayedSpace.name}`}
        className={getFloatingStatusBubbleClassName({
          className: `${interactive ? `group pointer-events-auto cursor-pointer ${themeColors.interactive.hoverPanel} ${themeColors.interactive.focusRing}` : 'cursor-default'} flex h-10 min-w-0 items-center py-1 pl-1 pr-3 transition-[color,background-color,border-color,opacity,filter] ease-out ${contentVisible ? 'opacity-100 blur-0' : 'opacity-0 blur-[3px]'}`,
          highlightOnHover: interactive,
        })}
        disabled={!visible || !interactive}
        style={{
          transitionDuration: `${SOFT_VALUE_TRANSITION_DURATION_MS}ms`,
          transitionProperty: 'color, background-color, border-color, opacity, filter',
        }}
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          if (interactive) openSpaceInfo(displayedSpace);
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
        <span className={`ml-2 min-w-0 truncate text-sm font-medium ${themeColors.text.primary} ${interactive ? `${themeColors.interactive.groupHoverAccentText} ${themeColors.transition}` : ''}`}>
          {displayedSpace.name}
        </span>
        {interactive && <span
          aria-hidden="true"
          className="inline-flex max-w-0 shrink-0 overflow-hidden opacity-0 transition-[max-width,margin-left,opacity] duration-200 ease-out group-hover:ml-1.5 group-hover:max-w-4 group-hover:opacity-100 group-focus-visible:ml-1.5 group-focus-visible:max-w-4 group-focus-visible:opacity-100"
        >
          <ArrowRightIcon
            className={`h-4 w-4 shrink-0 ${themeColors.text.tertiary} ${themeColors.interactive.groupHoverAccentText}`}
          />
        </span>}
      </button>}
    </FloatingStatusBubblePresence>
  );
}
