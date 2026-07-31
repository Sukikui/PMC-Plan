import type { Place } from '@/lib/api/types';
import {
  ContentSummaryIdentityView,
} from '@/components/content/ContentSummaryRow';
import SpaceLogo from '@/components/spaces/SpaceLogo';
import MinecraftHeadImage from '@/components/ui/MinecraftHeadImage';
import { TradeOfferColumnHeader } from '@/components/trade/TradeOfferPreview';
import { themeColors } from '@/lib/theme-colors';

type GlobalOfferPlace = Pick<
  Place,
  'id' | 'name' | 'owners' | 'space'
>;

interface GlobalOfferSourceProps {
  onOpenPlace: () => void;
  place: GlobalOfferPlace;
}

const sourceLayoutClassName =
  'grid min-w-0 flex-[2] self-stretch grid-cols-3 items-center gap-3 pr-4';

export function GlobalOfferSourceHeader() {
  return (
    <div className={sourceLayoutClassName}>
      <TradeOfferColumnHeader className="text-center">
        Lieu
      </TradeOfferColumnHeader>
      <TradeOfferColumnHeader className="text-center">
        Espace
      </TradeOfferColumnHeader>
      <TradeOfferColumnHeader className="text-center">
        Propriétaire
      </TradeOfferColumnHeader>
    </div>
  );
}

export default function GlobalOfferSource({
  onOpenPlace,
  place,
}: GlobalOfferSourceProps) {
  const owner = place.owners[0] ?? null;
  const additionalOwnerCount = Math.max(0, place.owners.length - 1);

  return (
    <div className={`${sourceLayoutClassName} border-r ${themeColors.border.light}`}>
      <button
        aria-label={`Ouvrir le lieu ${place.name}`}
        className={`${place.space ? '' : 'col-span-2'} min-w-0 truncate bg-transparent text-left text-sm font-medium outline-none ${themeColors.text.primary} ${themeColors.interactive.hoverAccentText} ${themeColors.transitionAll}`}
        onClick={onOpenPlace}
        title={place.name}
        type="button"
      >
        {place.name}
      </button>

      {place.space && (
        <ContentSummaryIdentityView
          avatar={(
            <SpaceLogo
              color={place.space.color}
              logoBackground={place.space.logoBackground}
              logoUrl={place.space.logoUrl}
              logoZoom={place.space.logoZoom}
              name={place.space.name}
              size="compact"
            />
          )}
          label={place.space.name}
        />
      )}

      <ContentSummaryIdentityView
        avatar={owner ? (
          <MinecraftHeadImage
            alt=""
            className="h-8 w-8 object-contain"
            loading="lazy"
            playerIdentifier={owner.uuid}
          />
        ) : undefined}
        label={owner?.name ?? 'Aucun propriétaire'}
        suffix={additionalOwnerCount > 0
          ? `+ ${additionalOwnerCount}`
          : undefined}
      />
    </div>
  );
}
