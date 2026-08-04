import type { ReactNode } from 'react';
import {
  MapEntrySummaryIcon,
  MapEntryWorldBadge,
} from '@/components/content/MapEntrySummaryPresentation';
import ServiceIllustration from '@/components/services/ServiceIllustration';
import IdentitySummary from '@/components/settings/IdentitySummary';
import SpaceLogo from '@/components/spaces/SpaceLogo';
import { ContentSummaryIdentityView } from '@/components/content/ContentSummaryRow';
import { ListRowButton } from '@/components/ui/ListRow';
import UserAvatar from '@/components/ui/UserAvatar';
import type { ContentManagementSummary } from '@/lib/content-management/types';
import { MANAGEMENT_LIST_ROW_HEIGHT_PX } from '@/lib/management/pagination';
import { formatSpaceContentSummary } from '@/lib/spaces/summary';
import { themeColors } from '@/lib/theme-colors';

const mapEntryGridClass = 'grid-cols-[minmax(0,1.65fr)_minmax(0,0.85fr)_minmax(0,0.7fr)]';
const compactIdentityGridClass = 'grid-cols-[minmax(0,1.3fr)_minmax(0,1.2fr)_minmax(0,0.7fr)]';

export default function ContentManagementRow({
  disabled,
  item,
  onOpen,
}: {
  disabled: boolean;
  item: ContentManagementSummary;
  onOpen: () => void;
}) {
  return (
    <ListRowButton
      className={`grid items-center gap-3 px-2 !py-0 ${getGridClass(item.type)} disabled:cursor-wait disabled:opacity-60`}
      disabled={disabled}
      onClick={onOpen}
      style={{ height: MANAGEMENT_LIST_ROW_HEIGHT_PX }}
    >
      <ContentPrimaryColumn item={item} />
      <ContentContext item={item} />
      <div className="min-w-0 pl-2">
        <ContentSummaryIdentityView
          avatar={(
            <UserAvatar
              alt=""
              className="h-8 w-8"
              src={item.primaryManager.image}
            />
          )}
          label={getUserName(item.primaryManager)}
          suffix={item.managerCount > 0 ? `+ ${item.managerCount}` : undefined}
        />
      </div>
    </ListRowButton>
  );
}

function ContentPrimaryColumn({ item }: { item: ContentManagementSummary }) {
  if (!isMapEntry(item)) return <ContentIdentity item={item} />;

  return (
    <div className="grid min-w-0 grid-cols-[5.5rem_minmax(0,1fr)] items-center gap-1">
      <div className="justify-self-start">
        <MapEntryWorldBadge
          linked={item.type === 'portal' && item.linked}
          type={item.type}
          world={item.world}
        />
      </div>
      <ContentIdentity item={item} />
    </div>
  );
}

function ContentIdentity({ item }: { item: ContentManagementSummary }) {
  return (
    <IdentitySummary
      avatar={getContentIdentity(item)}
      subtitle={item.type === 'space' ? `#${item.slug}` : item.slug}
      title={item.name}
    />
  );
}

function isMapEntry(
  item: ContentManagementSummary,
): item is Extract<ContentManagementSummary, { type: 'place' | 'portal' }> {
  return item.type === 'place' || item.type === 'portal';
}

function getGridClass(type: ContentManagementSummary['type']) {
  return type === 'space' || type === 'service'
    ? compactIdentityGridClass
    : mapEntryGridClass;
}

function ContentContext({ item }: { item: ContentManagementSummary }) {
  if (item.type === 'space') {
    return (
      <p className={`truncate text-xs ${themeColors.text.tertiary}`}>
        {formatSpaceContentSummary(item)}
      </p>
    );
  }
  if (item.type === 'service') {
    return (
      <p className={`truncate text-xs ${themeColors.text.tertiary}`}>
        {serviceContactLabels[item.contactType]}
      </p>
    );
  }

  return item.space ? (
    <div className="flex min-w-0 items-center gap-2 pl-8">
      <SpaceLogo
        color={item.space.color}
        logoBackground={item.space.logoBackground}
        logoUrl={item.space.logoUrl}
        logoZoom={item.space.logoZoom}
        name={item.space.name}
        size="compact"
      />
      <span className={`truncate text-xs ${themeColors.text.tertiary}`}>
        {item.space.name}
      </span>
    </div>
  ) : <span aria-hidden="true" />;
}

function getContentIdentity(item: ContentManagementSummary): ReactNode {
  if (item.type === 'space') {
    return (
      <SpaceLogo
        color={item.color}
        logoBackground={item.logoBackground}
        logoUrl={item.logoUrl}
        logoZoom={item.logoZoom}
        name={item.name}
        size="compact"
      />
    );
  }
  if (item.type === 'service') {
    return (
      <ServiceIllustration
        className="h-8 w-8"
        itemId={item.illustrationItemId}
      />
    );
  }
  return (
    <MapEntrySummaryIcon
      category={item.type === 'place' ? item.category : undefined}
      type={item.type}
    />
  );
}

function getUserName(user: { name: string | null; username: string | null }) {
  return user.name ?? user.username ?? 'Utilisateur Discord';
}

const serviceContactLabels = {
  none: 'Aucun contact',
  primary_manager: 'Gestionnaire principal',
  custom: 'Serveur Discord',
} as const;
