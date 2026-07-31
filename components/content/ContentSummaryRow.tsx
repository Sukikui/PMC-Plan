import type { ReactNode } from 'react';
import { ListRowButton } from '@/components/ui/ListRow';
import { themeColors } from '@/lib/theme-colors';

export interface ContentSummaryIdentity {
  avatar?: ReactNode;
  label: string;
  suffix?: string;
}

interface ContentSummaryRowProps {
  identity: ReactNode;
  metadata?: ReactNode;
  name: string;
  onOpen: () => void;
  person: ContentSummaryIdentity;
  reserveSecondaryColumn?: boolean;
  secondary?: ContentSummaryIdentity | null;
}

export default function ContentSummaryRow({
  identity,
  metadata,
  name,
  onOpen,
  person,
  reserveSecondaryColumn = false,
  secondary,
}: ContentSummaryRowProps) {
  const showSecondaryColumn = reserveSecondaryColumn || Boolean(secondary);
  const columns = showSecondaryColumn
    ? 'grid-cols-[minmax(0,1.45fr)_minmax(0,0.85fr)_minmax(0,0.8fr)_minmax(0,6.5rem)]'
    : 'grid-cols-[minmax(0,1.45fr)_minmax(0,0.9fr)_minmax(0,6.5rem)]';

  return (
    <ListRowButton
      className={`grid items-center gap-4 px-2 ${columns}`}
      onClick={onOpen}
    >
      <div className="flex min-w-0 items-center gap-3">
        {identity}
        <span className={`min-w-0 flex-1 truncate text-sm font-medium ${themeColors.text.primary}`}>
          {name}
        </span>
      </div>
      {showSecondaryColumn && (
        secondary
          ? <ContentSummaryIdentityView {...secondary} />
          : <span aria-hidden="true" />
      )}
      <ContentSummaryIdentityView {...person} />
      {metadata}
    </ListRowButton>
  );
}

export function ContentSummaryIdentityView({
  avatar,
  label,
  suffix,
}: ContentSummaryIdentity) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      {avatar && <div className="shrink-0">{avatar}</div>}
      <span
        className={`truncate text-xs ${themeColors.text.tertiary}`}
        title={label}
      >
        {label}
      </span>
      {suffix && (
        <span className={`shrink-0 text-xs ${themeColors.text.muted}`}>
          {suffix}
        </span>
      )}
    </div>
  );
}
