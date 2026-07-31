import ContentSummaryRow from '@/components/content/ContentSummaryRow';
import {
  MapEntrySummaryIcon,
  MapEntryWorldBadge,
} from '@/components/content/MapEntrySummaryPresentation';
import MinecraftHeadImage from '@/components/ui/MinecraftHeadImage';
import { interactiveListGroupClassName } from '@/components/ui/ListRow';
import type {
  SpacePlaceSummary,
  SpacePortalSummary,
} from '@/lib/spaces/types';
import { themeColors } from '@/lib/theme-colors';

interface SpaceContentListProps {
  items: Array<SpacePlaceSummary | SpacePortalSummary>;
  onOpen: (mapEntryId: string) => void;
  type: 'place' | 'portal';
}

export default function SpaceContentList({
  items,
  onOpen,
  type,
}: SpaceContentListProps) {
  if (items.length === 0) {
    return (
      <p className={`py-8 text-center text-sm ${themeColors.text.tertiary}`}>
        {type === 'place'
          ? 'Aucun lieu n’est rattaché à cet espace.'
          : 'Aucun portail n’est rattaché à cet espace.'}
      </p>
    );
  }

  return (
    <div className={interactiveListGroupClassName}>
      {items.map((item) => {
        const owner = item.owners[0];
        const linked = type === 'portal'
          && 'linked' in item
          && item.linked;

        return (
          <ContentSummaryRow
            identity={(
              <MapEntrySummaryIcon
                category={'category' in item ? item.category : undefined}
                type={type}
              />
            )}
            key={item.mapEntryId}
            metadata={(
              <MapEntryWorldBadge
                linked={linked}
                type={type}
                world={item.world}
              />
            )}
            name={item.name}
            onOpen={() => onOpen(item.mapEntryId)}
            person={{
              avatar: owner ? (
                <MinecraftHeadImage
                  alt=""
                  className="h-8 w-8 object-contain"
                  loading="lazy"
                  playerIdentifier={owner.uuid}
                />
              ) : undefined,
              label: owner?.name ?? 'Aucun propriétaire',
              suffix: item.owners.length > 1
                ? `+ ${item.owners.length - 1}`
                : undefined,
            }}
          />
        );
      })}
    </div>
  );
}
