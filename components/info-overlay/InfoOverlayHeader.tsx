'use client';

import CrossIcon from '@/components/icons/CrossIcon';
import PencilIcon from '@/components/icons/PencilIcon';
import TargetIcon from '@/components/icons/TargetIcon';
import IconActionButton from '@/components/ui/IconActionButton';
import type { Place, Portal } from '@/app/api/utils/shared';
import { getMapIconSrc, type MapIconCategory } from '@/lib/place/categories';
import { getRenderUrl } from '@/lib/starlight-skin-api';
import { getWorldBadgeLarge } from '@/lib/ui-utils';
import { themeColors } from '@/lib/theme-colors';

interface InfoOverlayHeaderProps {
  additionalOwners: string[];
  canEdit: boolean;
  iconCategory: MapIconCategory;
  item: Place | Portal;
  itemNetherAddress?: string | null;
  primaryOwner: string | null;
  showOwnerTooltip: boolean;
  type: 'place' | 'portal';
  onClose: () => void;
  onEdit: () => void;
  onOwnerTooltipChange: (visible: boolean) => void;
  onSelectItem: () => void;
}

export default function InfoOverlayHeader({
  additionalOwners,
  canEdit,
  iconCategory,
  item,
  itemNetherAddress,
  primaryOwner,
  showOwnerTooltip,
  type,
  onClose,
  onEdit,
  onOwnerTooltipChange,
  onSelectItem,
}: InfoOverlayHeaderProps) {
  return (
    <div className={`flex-shrink-0 p-6 border-b ${themeColors.border.primary} ${themeColors.panel.primary} ${themeColors.transition} rounded-t-xl z-10`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <TitleRow iconCategory={iconCategory} item={item} type={type} />
          <CoordinateRow item={item} itemNetherAddress={itemNetherAddress} type={type} onSelectItem={onSelectItem} />
        </div>

        {type === 'place' && primaryOwner && (
          <OwnerSkin
            additionalOwners={additionalOwners}
            primaryOwner={primaryOwner}
            showOwnerTooltip={showOwnerTooltip}
            onOwnerTooltipChange={onOwnerTooltipChange}
          />
        )}

        <div className="flex flex-col items-end">
          <IconActionButton onClick={onClose} className="ml-2 flex-shrink-0" aria-label="Fermer">
            <CrossIcon className={`w-4 h-4 ${themeColors.text.secondary}`} />
          </IconActionButton>
          {canEdit && (
            <IconActionButton onClick={onEdit} className="ml-2 mt-2 flex-shrink-0" aria-label="Modifier">
              <PencilIcon className={`w-4 h-4 ${themeColors.text.secondary}`} />
            </IconActionButton>
          )}
        </div>
      </div>
    </div>
  );
}

function TitleRow({ iconCategory, item, type }: { iconCategory: MapIconCategory; item: Place | Portal; type: 'place' | 'portal' }) {
  return (
    <div className="mb-2 flex min-w-0 items-center gap-3">
      <img src={getMapIconSrc(iconCategory)} alt="" aria-hidden="true" className="h-9 w-9 shrink-0 object-contain" />
      <h2 className={`min-w-0 text-2xl font-bold ${themeColors.text.primary} ${themeColors.transition}`}>{item.name}</h2>
      {type === 'place' && (item as Place).discord && (
        <a
          href={(item as Place).discord!}
          target="_blank"
          rel="noopener noreferrer"
          className={`shrink-0 ${themeColors.link} ${themeColors.transitionAll} outline-none`}
          style={{ backgroundColor: 'transparent', border: 'none', boxShadow: 'none' }}
        >
          <DiscordIcon />
        </a>
      )}
    </div>
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
        <span className={getWorldBadgeLarge(item.world)}>{item.world}</span>
        <div onClick={onSelectItem} className="flex items-center gap-1 cursor-pointer group" aria-label="Sélectionner dans le panneau">
          <span className={`text-sm ${themeColors.text.tertiary} group-hover:text-blue-500 dark:group-hover:text-blue-400 ${themeColors.transition}`}>
            {item.coordinates.x}, {item.coordinates.y}, {item.coordinates.z}
          </span>
          <TargetIcon className={`w-4 h-4 ${themeColors.text.secondary} group-hover:text-blue-500 dark:group-hover:text-blue-400 ${themeColors.transition}`} />
        </div>

        {itemNetherAddress && (
          <span className={`text-sm ${themeColors.infoOverlay.netherAddressText} ${themeColors.transition} ml-auto`}>
            {itemNetherAddress}
          </span>
        )}
      </div>

      {type === 'portal' && netherAssociate?.address && (
        <div className={`mt-2 pt-2 border-t ${themeColors.border.primary} ${themeColors.transition}`}>
          <div className="flex items-center gap-2">
            <span className={getWorldBadgeLarge('nether')}>nether</span>
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

function OwnerSkin({
  additionalOwners,
  primaryOwner,
  showOwnerTooltip,
  onOwnerTooltipChange,
}: {
  additionalOwners: string[];
  primaryOwner: string;
  showOwnerTooltip: boolean;
  onOwnerTooltipChange: (visible: boolean) => void;
}) {
  return (
    <div className="relative flex-shrink-0 mr-2">
      <div onMouseEnter={() => onOwnerTooltipChange(true)} onMouseLeave={() => onOwnerTooltipChange(false)}>
        <img
          key={`skin-${primaryOwner}`}
          src={getRenderUrl(primaryOwner, { renderType: 'head', crop: 'full', borderHighlight: true, borderHighlightRadius: 7, dropShadow: true })}
          alt={`Skin de ${primaryOwner}`}
          className="w-20 h-20 object-contain transition-transform duration-200 hover:scale-110"
          style={{ imageRendering: 'pixelated' }}
          crossOrigin="anonymous"
          loading="eager"
          onError={(event) => {
            event.currentTarget.style.display = 'none';
          }}
        />
      </div>

      {showOwnerTooltip && (
        <div className={`absolute -top-4 left-1/2 transform -translate-x-1/2 -translate-y-full px-3 py-2 text-sm font-medium ${themeColors.util.roundedFull} ${themeColors.infoOverlay.placeTags} whitespace-nowrap z-[10000]`}>
          <span className="opacity-75">Propriétaire : </span>
          <span className="font-bold">
            {additionalOwners.length ? `${primaryOwner} (+${additionalOwners.length})` : primaryOwner}
          </span>
        </div>
      )}
    </div>
  );
}

function DiscordIcon() {
  return (
    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.211.375-.445.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.197.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
}
