'use client';

import { useQueryClient } from '@tanstack/react-query';
import type { SpaceReference } from '@/lib/spaces/types';
import { spaceDetailQueryOptions } from '@/lib/spaces/client';
import { themeColors } from '@/lib/theme-colors';
import SpaceLogo from './SpaceLogo';

interface SpaceHeaderLinkProps {
  onClick: () => void;
  space: SpaceReference;
}

export default function SpaceHeaderLink({
  onClick,
  space,
}: SpaceHeaderLinkProps) {
  const queryClient = useQueryClient();
  const prefetch = () => {
    void queryClient.prefetchQuery(spaceDetailQueryOptions(space.slug));
  };

  return (
    <button
      className={`group flex min-w-0 items-center gap-2 ${themeColors.interactive.focusRing}`}
      type="button"
      onClick={onClick}
      onFocus={prefetch}
      onPointerEnter={prefetch}
      onPointerDown={prefetch}
    >
      <SpaceLogo
        color={space.color}
        logoBackground={space.logoBackground}
        logoUrl={space.logoUrl}
        logoZoom={space.logoZoom}
        name={space.name}
        size="header"
      />
      <span className={`truncate text-lg font-semibold ${themeColors.text.primary} ${themeColors.interactive.groupHoverAccentText} ${themeColors.transition}`}>
        {space.name}
      </span>
    </button>
  );
}
