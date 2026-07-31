import TargetIcon from '@/components/icons/TargetIcon';
import SpaceHeaderLink from '@/components/spaces/SpaceHeaderLink';
import WorldBadge from '@/components/ui/WorldBadge';
import type { Place, Portal } from '@/lib/api/types';
import { getMapIconSrc, type MapIconCategory } from '@/lib/place/categories';
import { themeColors } from '@/lib/theme-colors';
import ContentInfoOverlayHeader from './ContentInfoOverlayHeader';

interface InfoOverlayHeaderProps {
  canEdit: boolean;
  iconCategory: MapIconCategory;
  item: Place | Portal;
  itemNetherAddress?: string | null;
  onOpenSpace: (slug: string) => void;
  type: 'place' | 'portal';
  onClose: () => void;
  onEdit: () => void;
  onSelectItem: () => void;
}

export default function InfoOverlayHeader({
  canEdit,
  iconCategory,
  item,
  itemNetherAddress,
  onOpenSpace,
  type,
  onClose,
  onEdit,
  onSelectItem,
}: InfoOverlayHeaderProps) {
  const space = item.space;

  return (
    <ContentInfoOverlayHeader
      canEdit={canEdit}
      discordUrl={type === 'place' ? (item as Place).discord : null}
      identity={(
        <img
          src={getMapIconSrc(iconCategory)}
          alt=""
          aria-hidden="true"
          className="h-9 w-9 shrink-0 object-contain"
        />
      )}
      metadata={(
        <CoordinateRow
          item={item}
          itemNetherAddress={itemNetherAddress}
          type={type}
          onSelectItem={onSelectItem}
        />
      )}
      onClose={onClose}
      onEdit={onEdit}
      secondaryIdentity={space ? (
        <SpaceHeaderLink
          space={space}
          onClick={() => onOpenSpace(space.slug)}
        />
      ) : undefined}
      title={item.name}
    />
  );
}

function CoordinateRow({
  item,
  itemNetherAddress,
  type,
  onSelectItem,
}: {
  item: Place | Portal;
  itemNetherAddress?: string | null;
  type: 'place' | 'portal';
  onSelectItem: () => void;
}) {
  const netherAssociate = (item as Portal)['nether-associate'];

  return (
    <>
      <div className="flex items-center gap-3">
        <WorldBadge size="large" world={item.world} />
        <button
          type="button"
          onClick={onSelectItem}
          className={`group flex items-center gap-1 border-0 bg-transparent p-0 ${themeColors.interactive.focusRing}`}
          aria-label="Sélectionner dans le panneau"
        >
          <span className={`text-sm ${themeColors.text.tertiary} ${themeColors.interactive.groupHoverAccentText} ${themeColors.transition}`}>
            {item.coordinates.x}, {item.coordinates.y}, {item.coordinates.z}
          </span>
          <TargetIcon className={`w-4 h-4 ${themeColors.text.secondary} ${themeColors.interactive.groupHoverAccentText} ${themeColors.transition}`} />
        </button>

        {itemNetherAddress && (
          <span className={`text-sm ${themeColors.infoOverlay.netherAddressText} ${themeColors.transition} ml-auto`}>
            {itemNetherAddress}
          </span>
        )}
      </div>

      {type === 'portal' && netherAssociate?.address && (
        <div className={`mt-2 pt-2 border-t ${themeColors.border.primary} ${themeColors.transition}`}>
          <div className="flex items-center gap-2">
            <WorldBadge size="large" world="nether" />
            <div className="flex items-center justify-between w-full">
              <span className={`text-sm ${themeColors.text.tertiary} ${themeColors.transition}`}>
                {netherAssociate.coordinates.x}, {netherAssociate.coordinates.y}, {netherAssociate.coordinates.z}
              </span>
              <span className={`text-sm ${themeColors.text.tertiary} ${themeColors.transition}`}>
                {netherAssociate.address}
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
