'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useAdminMode } from '@/components/admin/AdminModeProvider';
import { useOverlay } from '@/components/overlay/OverlayProvider';
import { interactiveListGroupClassName } from '@/components/ui/ListRow';
import { fetchContentManagement } from '@/lib/content-management/client';
import type {
  ContentManagementFilter,
  ContentManagementScope,
  ContentManagementSummary,
  ContentManagementType,
} from '@/lib/content-management/types';
import { canAdministerContent } from '@/lib/content-permissions';
import type { SelectDestinationHandler } from '@/lib/destination/selection';
import {
  fetchService,
  subscribeToServicesInvalidation,
} from '@/lib/services/client';
import { subscribeToSpacesInvalidation } from '@/lib/spaces/client';
import { subscribeToMainScreenDataInvalidation } from '@/lib/preload/main-screen';
import { themeColors } from '@/lib/theme-colors';
import ManagementListFrame from '@/components/settings/management/ManagementListFrame';
import usePaginatedManagementQuery from '@/components/settings/management/usePaginatedManagementQuery';
import ContentManagementRow from './ContentManagementRow';

export default function ContentManagementList({
  onSelectItem,
  scope,
  type,
}: {
  onSelectItem?: SelectDestinationHandler;
  scope: ContentManagementScope;
  type: ContentManagementType;
}) {
  const { data: session } = useSession();
  const { effectiveRole } = useAdminMode();
  const {
    openMapEntryInfoById,
    openServiceEditor,
    openSpaceInfoBySlug,
  } = useOverlay();
  const [filter, setFilter] = useState<ContentManagementFilter>('all');
  const [openingId, setOpeningId] = useState<string | null>(null);
  const [refreshVersion, setRefreshVersion] = useState(0);
  const load = useCallback(async (
    page: number,
    query: string,
    signal: AbortSignal,
  ) => fetchContentManagement({
    filter,
    page,
    query,
    scope,
    signal,
    type,
  }), [filter, scope, type]);
  const state = usePaginatedManagementQuery({
    load,
    refreshKey: String(refreshVersion),
  });
  const config = contentListConfig[type];

  useEffect(() => {
    const subscribe = type === 'space'
      ? subscribeToSpacesInvalidation
      : type === 'service'
        ? subscribeToServicesInvalidation
        : subscribeToMainScreenDataInvalidation;
    return subscribe(() => setRefreshVersion((current) => current + 1));
  }, [type]);

  const updateFilter = (value: ContentManagementFilter) => {
    setFilter(value);
    state.setPage(1);
  };
  const openItem = async (item: ContentManagementSummary) => {
    setOpeningId(item.id);
    state.setError(null);
    try {
      if (item.type === 'place' || item.type === 'portal') {
        await openMapEntryInfoById(item.mapEntryId, item.type, onSelectItem);
      } else if (item.type === 'space') {
        await openSpaceInfoBySlug(item.slug);
      } else {
        const service = await fetchService(item.slug);
        openServiceEditor(
          service,
          canAdministerContent(
            effectiveRole,
            session?.user?.id,
            service.primaryManagerId,
          ),
        );
      }
    } catch (error) {
      state.setError(error instanceof Error
        ? error.message
        : 'Impossible d’ouvrir ce contenu.');
    } finally {
      setOpeningId(null);
    }
  };
  const controls = config.filters ? (
    <div className="flex flex-nowrap gap-1">
      {config.filters.map(({ label, value }) => (
        <button
          key={value}
          type="button"
          onClick={() => updateFilter(value)}
          className={`${themeColors.toggle.compactBase} shrink-0 whitespace-nowrap ${
            filter === value
              ? themeColors.toggle.activeBlue
              : themeColors.toggle.inactive
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  ) : undefined;

  return (
    <ManagementListFrame
      controls={controls}
      empty={state.data.items.length === 0}
      emptyLabel={`Aucun ${config.singular} trouvé.`}
      error={state.error}
      loading={state.loading}
      onPageChange={state.setPage}
      onQueryChange={state.setQuery}
      pagination={state.data.pagination}
      query={state.query}
      resultLabel={state.data.pagination.total > 1
        ? config.plural
        : config.singular}
      searchPlaceholder={`Rechercher un ${config.singular}...`}
    >
      <div className={interactiveListGroupClassName}>
        {state.data.items.map((item) => (
          <ContentManagementRow
            disabled={openingId !== null}
            item={item}
            key={`${item.type}-${item.id}`}
            onOpen={() => void openItem(item)}
          />
        ))}
      </div>
    </ManagementListFrame>
  );
}

const worldFilters = [
  { value: 'all' as const, label: 'Tous' },
  { value: 'overworld' as const, label: 'Overworld' },
  { value: 'nether' as const, label: 'Nether' },
];

const contentListConfig: Record<ContentManagementType, {
  singular: string;
  plural: string;
  filters?: Array<{ value: ContentManagementFilter; label: string }>;
}> = {
  place: {
    singular: 'lieu',
    plural: 'lieux',
    filters: worldFilters,
  },
  portal: {
    singular: 'portail',
    plural: 'portails',
    filters: [
      ...worldFilters,
      { value: 'linked' as const, label: 'Liés' },
    ],
  },
  space: {
    singular: 'espace',
    plural: 'espaces',
  },
  service: {
    singular: 'service',
    plural: 'services',
    filters: [
      { value: 'all', label: 'Tous' },
      { value: 'none', label: 'Aucun contact' },
      { value: 'primary_manager', label: 'Gestionnaire principal' },
      { value: 'custom', label: 'Serveur Discord' },
    ],
  },
};
