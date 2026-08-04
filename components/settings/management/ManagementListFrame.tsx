import type { ReactNode } from 'react';
import { themeColors } from '@/lib/theme-colors';
import { MANAGEMENT_LIST_VIEWPORT_HEIGHT_PX } from '@/lib/management/pagination';
import type { ManagementPagination } from './usePaginatedManagementQuery';

interface ManagementListFrameProps {
  children: ReactNode;
  controls?: ReactNode;
  empty: boolean;
  emptyLabel: string;
  error: string | null;
  loading: boolean;
  onPageChange: (page: number) => void;
  onQueryChange: (query: string) => void;
  pagination: ManagementPagination;
  query: string;
  resultLabel: string;
  searchPlaceholder: string;
}

export default function ManagementListFrame({
  children,
  controls,
  empty,
  emptyLabel,
  error,
  loading,
  onPageChange,
  onQueryChange,
  pagination,
  query,
  resultLabel,
  searchPlaceholder,
}: ManagementListFrameProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <input
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder={searchPlaceholder}
          className={`w-full border px-3 py-2 text-sm lg:max-w-sm ${themeColors.input.search} ${themeColors.util.roundedLg} focus:outline-none focus:ring-2 ${themeColors.placeholder}`}
        />
        {controls}
      </div>

      {error && <p className={`text-sm ${themeColors.feedback.errorText}`}>{error}</p>}
      <div style={{ height: MANAGEMENT_LIST_VIEWPORT_HEIGHT_PX }}>
        {loading ? (
          <ManagementListMessage>Chargement...</ManagementListMessage>
        ) : empty ? (
          <ManagementListMessage>{emptyLabel}</ManagementListMessage>
        ) : children}
      </div>

      <div className="flex items-center justify-between gap-4">
        <span className={`text-xs ${themeColors.text.tertiary}`}>
          {pagination.total} {resultLabel}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={pagination.page <= 1 || loading}
            onClick={() => onPageChange(Math.max(1, pagination.page - 1))}
            className={paginationButtonClass}
          >
            Précédent
          </button>
          <span className={`text-xs tabular-nums ${themeColors.text.secondary}`}>
            {pagination.page}/{pagination.totalPages}
          </span>
          <button
            type="button"
            disabled={pagination.page >= pagination.totalPages || loading}
            onClick={() => onPageChange(pagination.page + 1)}
            className={paginationButtonClass}
          >
            Suivant
          </button>
        </div>
      </div>
    </div>
  );
}

function ManagementListMessage({ children }: { children: ReactNode }) {
  return (
    <p className={`flex h-full items-center justify-center text-center text-sm ${themeColors.text.tertiary}`}>
      {children}
    </p>
  );
}

const paginationButtonClass = `rounded-lg px-2.5 py-1.5 text-xs ${themeColors.button.ghost} ${themeColors.transitionAll} ${themeColors.util.activeScale} disabled:cursor-not-allowed disabled:opacity-40`;
