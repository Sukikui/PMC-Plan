import {
  DEFAULT_PLACE_CATEGORY,
  getMapIconSrc,
  isPlaceCategory,
  type PlaceCategory,
} from '@/lib/place/categories';
import { themeColors } from '@/lib/theme-colors';

type MapEntrySummaryType = 'place' | 'portal';
type MapEntryWorld = 'overworld' | 'nether';

interface MapEntrySummaryIconProps {
  category?: PlaceCategory | null;
  type: MapEntrySummaryType;
}

export function MapEntrySummaryIcon({
  category,
  type,
}: MapEntrySummaryIconProps) {
  const placeCategory = category && isPlaceCategory(category)
    ? category
    : DEFAULT_PLACE_CATEGORY;
  const resolvedCategory = type === 'portal'
    ? 'portail'
    : placeCategory;

  return (
    <img
      alt=""
      aria-hidden="true"
      className="h-8 w-8 shrink-0 object-contain"
      src={getMapIconSrc(resolvedCategory)}
    />
  );
}

interface MapEntryWorldBadgeProps {
  linked?: boolean;
  type: MapEntrySummaryType;
  world: string;
}

export function MapEntryWorldBadge({
  linked = false,
  type,
  world,
}: MapEntryWorldBadgeProps) {
  const linkedPortal = type === 'portal' && linked;
  const resolvedWorld: MapEntryWorld = world === 'nether'
    ? 'nether'
    : 'overworld';
  const color = linkedPortal ? 'linked' : resolvedWorld;

  return (
    <span className={`justify-self-end whitespace-nowrap px-2 py-1 text-xs font-medium ${themeColors.util.roundedFull} ${themeColors.world[color]}`}>
      {linkedPortal ? 'over+nether' : resolvedWorld}
    </span>
  );
}
