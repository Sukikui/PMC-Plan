'use client';

import { useEffect, useMemo, useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import SpaceLogo from '@/components/spaces/SpaceLogo';
import EmptySearchResult from '@/components/ui/EmptySearchResult';
import MinecraftHeadImage from '@/components/ui/MinecraftHeadImage';
import OverlayHeader from '@/components/ui/OverlayHeader';
import OverlaySearchInput from '@/components/ui/OverlaySearchInput';
import OverlaySurface from '@/components/ui/OverlaySurface';
import InfiniteLoadSentinel from '@/components/ui/InfiniteLoadSentinel';
import { useDebouncedValue } from '@/components/ui/useDebouncedValue';
import { spaceSummariesQueryOptions } from '@/lib/spaces/client';
import { formatSpaceContentSummary } from '@/lib/spaces/summary';
import type { SpaceSummary } from '@/lib/spaces/types';
import { themeColors } from '@/lib/theme-colors';

interface SpaceExplorerOverlayProps {
  onClose: () => void;
  onOpenSpace: (space: SpaceSummary) => void;
}

export default function SpaceExplorerOverlay({
  onClose,
  onOpenSpace,
}: SpaceExplorerOverlayProps) {
  const [query, setQuery] = useState('');
  const deferredQuery = useDebouncedValue(query.trim());
  const spacesQuery = useInfiniteQuery(
    spaceSummariesQueryOptions(deferredQuery),
  );
  const spaces = useMemo(
    () => spacesQuery.data?.pages.flatMap(({ items }) => items) ?? [],
    [spacesQuery.data],
  );
  const total = spacesQuery.data?.pages[0]?.pagination.total ?? 0;

  return (
    <OverlaySurface ariaLabel="Explorer les espaces" size="large">
      <OverlayHeader
        onClose={onClose}
        subtitle={spacesQuery.isPending
          ? 'Chargement...'
          : `${total} espace${total === 1 ? '' : 's'}`}
        title="Explorer les espaces"
      />

      <div className={`relative min-h-0 flex-1 overflow-hidden ${themeColors.panel.primary} ${themeColors.transition}`}>
        <div className={`pointer-events-none absolute inset-x-0 top-0 z-10 h-20 gradient-top-solid-blur ${themeColors.transition}`} />
        <div className="absolute inset-x-0 top-0 z-20 flex items-center px-6 pb-2 pt-4">
          <OverlaySearchInput
            ariaLabel="Rechercher un espace"
            onChange={setQuery}
            placeholder="Rechercher par nom, description, membres..."
            value={query}
          />
        </div>
        <div className="h-full overflow-y-auto px-6 pb-6 pt-[4.5rem] [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
          <SpaceExplorerContent
            error={spacesQuery.error?.message ?? null}
            loading={spacesQuery.isPending}
            onOpenSpace={onOpenSpace}
            spaces={spaces}
          />
          <InfiniteLoadSentinel
            hasNextPage={Boolean(spacesQuery.hasNextPage)}
            loading={spacesQuery.isFetchingNextPage}
            onLoadMore={() => void spacesQuery.fetchNextPage()}
          />
        </div>
        <div className={`pointer-events-none absolute inset-x-0 bottom-0 h-2 ${themeColors.gradient.bottomSolid} ${themeColors.transition}`} />
        <div className={`pointer-events-none absolute inset-x-0 bottom-2 h-8 ${themeColors.gradient.bottomBlur} ${themeColors.transition}`} />
      </div>
    </OverlaySurface>
  );
}

function SpaceExplorerContent({
  error,
  loading,
  onOpenSpace,
  spaces,
}: {
  error: string | null;
  loading: boolean;
  onOpenSpace: (space: SpaceSummary) => void;
  spaces: SpaceSummary[];
}) {
  if (loading) {
    return (
      <p className={`py-12 text-center text-sm ${themeColors.text.tertiary}`}>
        Chargement...
      </p>
    );
  }

  if (error) {
    return (
      <p className={`py-12 text-center text-sm ${themeColors.feedback.errorText}`}>
        {error}
      </p>
    );
  }

  if (spaces.length === 0) return <EmptySearchResult />;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {spaces.map((space) => (
        <SpaceExplorerTile
          key={space.id}
          onOpen={() => onOpenSpace(space)}
          space={space}
        />
      ))}
    </div>
  );
}

function SpaceExplorerTile({
  onOpen,
  space,
}: {
  onOpen: () => void;
  space: SpaceSummary;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const imageUrl = space.previewImage;

  useEffect(() => setImageFailed(false), [imageUrl]);

  return (
    <button
      aria-label={`Ouvrir l’espace ${space.name}`}
      className={`group flex h-full flex-col overflow-hidden border text-left ${themeColors.util.roundedLg} ${themeColors.panel.inset} ${themeColors.border.primary} ${themeColors.interactive.hoverBorder} ${themeColors.interactive.focusRing} ${themeColors.shadow.button} ${themeColors.transitionAll} hover:-translate-y-0.5`}
      onClick={onOpen}
      type="button"
    >
      <div className={`flex aspect-[2/1] w-full shrink-0 items-center justify-center overflow-hidden ${themeColors.panel.secondary}`}>
        {imageUrl && !imageFailed ? (
          <img
            alt={`Aperçu de ${space.name}`}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.025]"
            referrerPolicy="no-referrer"
            src={imageUrl}
            onError={() => setImageFailed(true)}
          />
        ) : (
          <SpaceLogo
            color={space.color}
            logoBackground={space.logoBackground}
            logoUrl={space.logoUrl}
            logoZoom={space.logoZoom}
            name={space.name}
            size="large"
          />
        )}
      </div>

      <div className="flex w-full flex-1 flex-col p-4">
        <div className="flex min-w-0 items-center gap-3">
          <SpaceLogo
            color={space.color}
            logoBackground={space.logoBackground}
            logoUrl={space.logoUrl}
            logoZoom={space.logoZoom}
            name={space.name}
            size="small"
          />
          <h3 className={`truncate text-base font-semibold ${themeColors.text.primary}`}>
            {space.name}
          </h3>
        </div>

        <p className={`mt-3 line-clamp-2 min-h-10 text-sm leading-5 ${themeColors.text.tertiary}`}>
          {space.description || 'Aucune description.'}
        </p>

        <SpaceTileSummary space={space} />
      </div>
    </button>
  );
}

function SpaceTileSummary({ space }: { space: SpaceSummary }) {
  const summary = formatSpaceContentSummary({
    offerCount: space.offerCount ?? 0,
    placeCount: space.placeCount,
    portalCount: space.portalCount,
  });
  const member = space.firstMember;
  const additionalMemberCount = Math.max(0, space.memberCount - 1);

  return (
    <div className={`mt-4 flex min-h-11 min-w-0 items-center gap-3 border-t pt-3 ${themeColors.border.light}`}>
      {summary && (
        <span className={`shrink-0 text-xs ${themeColors.text.tertiary}`}>
          {summary}
        </span>
      )}
      {member && (
        <div className="ml-auto flex min-w-0 items-center gap-2">
          <MinecraftHeadImage
            alt={`Tête de ${member.name}`}
            className="h-7 w-7 shrink-0"
            loading="lazy"
            playerIdentifier={member.uuid}
          />
          <span className={`min-w-0 truncate text-xs ${themeColors.text.tertiary}`}>
            {member.name}
          </span>
          {additionalMemberCount > 0 && (
            <span className={`shrink-0 text-xs ${themeColors.text.muted}`}>
              + {additionalMemberCount}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
