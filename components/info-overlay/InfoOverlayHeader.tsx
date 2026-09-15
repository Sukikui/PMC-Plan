import TargetIcon from '@/components/icons/TargetIcon';
import SpaceHeaderLink from '@/components/spaces/SpaceHeaderLink';
import WorldBadge from '@/components/ui/WorldBadge';
import type { Coordinates, Place, Portal } from '@/lib/api/types';
import { toMapWorld } from '@/lib/destination/selection';
import type { MapWorld } from '@/lib/map/metadata';
import type { PlaceSummary, PortalSummary } from '@/lib/map-content/types';
import type { SpaceReference } from '@/lib/spaces/types';
import { getMapIconSrc, type MapIconCategory } from '@/lib/place/categories';
import { getPublicContentPath } from '@/lib/content-path';
import { themeColors } from '@/lib/theme-colors';
import ContentInfoOverlayHeader from './ContentInfoOverlayHeader';
import PortalIdentityLabel from '@/components/portal/PortalIdentityLabel';

interface InfoOverlayHeaderProps {
  canEdit: boolean;
  iconCategory: MapIconCategory;
  item: Place | Portal | PlaceSummary | PortalSummary;
  itemNetherAddress?: string | null;
  onOpenSpace: (space: SpaceReference) => void;
  type: 'place' | 'portal';
  onClose: () => void;
  onEdit: () => void;
  onSelectItem: (world: MapWorld) => void;
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
  const slug = type === 'place' ? item.id : (item as Portal | PortalSummary).slug;

  return (
    <ContentInfoOverlayHeader
      canEdit={canEdit}
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
          onClick={() => onOpenSpace(space)}
        />
      ) : undefined}
      sharePath={getPublicContentPath(type, slug)}
      title={type === 'portal' && 'unidentified' in item && item.unidentified
        ? <PortalIdentityLabel />
        : item.name}
      titleMaxLines={2}
    />
  );
}

function CoordinateRow({
  item,
  itemNetherAddress,
  type,
  onSelectItem,
}: {
  item: Place | Portal | PlaceSummary | PortalSummary;
  itemNetherAddress?: string | null;
  type: 'place' | 'portal';
  onSelectItem: (world: MapWorld) => void;
}) {
  const netherAssociate = (item as Portal)['nether-associate'];

  return (
    <>
      <div className="flex items-center gap-3">
        <WorldBadge size="large" world={item.world} />
        <CoordinateSelectButton
          coordinates={item.coordinates}
          onSelectItem={onSelectItem}
          world={toMapWorld(item.world)}
        />

        {itemNetherAddress && (
          <span className={`text-sm ${themeColors.infoOverlay.netherAddressText} ${themeColors.transition} ml-auto`}>
            {itemNetherAddress}
          </span>
        )}
      </div>

      {type === 'portal' && netherAssociate && (
        <div className={`mt-2 pt-2 border-t ${themeColors.border.primary} ${themeColors.transition}`}>
          <div className="flex items-center gap-2">
            <WorldBadge size="large" world="nether" />
            <div className="flex items-center justify-between w-full">
              <CoordinateSelectButton
                coordinates={netherAssociate.coordinates}
                onSelectItem={onSelectItem}
                world="nether"
              />
              {netherAssociate.address && (
                <span className={`text-sm ${themeColors.text.tertiary} ${themeColors.transition}`}>
                  {netherAssociate.address}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function CoordinateSelectButton({
  coordinates,
  onSelectItem,
  world,
}: {
  coordinates: Coordinates;
  onSelectItem: (world: MapWorld) => void;
  world: MapWorld;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelectItem(world)}
      className={`group flex items-center gap-1 border-0 bg-transparent p-0 ${themeColors.interactive.focusRing}`}
      aria-label={`Afficher ces coordonnées dans ${world === 'nether' ? 'le Nether' : "l'Overworld"}`}
    >
      <span className={`text-sm ${themeColors.text.tertiary} ${themeColors.interactive.groupHoverAccentText} ${themeColors.transition}`}>
        {coordinates.x}, {coordinates.y}, {coordinates.z}
      </span>
      <TargetIcon className={`h-4 w-4 ${themeColors.text.secondary} ${themeColors.interactive.groupHoverAccentText} ${themeColors.transition}`} />
    </button>
  );
}
