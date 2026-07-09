'use client';

import PlusIcon from '@/components/icons/PlusIcon';
import IconActionButton from '@/components/ui/IconActionButton';
import type { Place, Portal } from '@/app/api/utils/shared';
import { getWorldBadge } from '@/lib/ui-utils';
import { themeColors } from '@/lib/theme-colors';
import {
  DEFAULT_PLACE_CATEGORY,
  getMapIconSrc,
  isPlaceCategory,
  type MapIconCategory,
} from '@/lib/place/categories';
import type { DestinationCardActions } from './destination-panel-types';

const DESCRIPTION_PREVIEW_MAX_LENGTH = 180;
const DESCRIPTION_PREVIEW_MIN_SENTENCE_LENGTH = 40;

const formatDescriptionPreview = (description: string) => {
  const trimmedDescription = description.trim();

  if (trimmedDescription.length <= DESCRIPTION_PREVIEW_MAX_LENGTH) {
    return trimmedDescription;
  }

  const preview = trimmedDescription.slice(0, DESCRIPTION_PREVIEW_MAX_LENGTH).trimEnd();
  const lastPeriodIndex = preview.lastIndexOf('.');

  if (lastPeriodIndex >= DESCRIPTION_PREVIEW_MIN_SENTENCE_LENGTH - 1) {
    return preview.slice(0, lastPeriodIndex + 1);
  }

  return preview.replace(/\s+\S*$/, '') + '...';
};

const getDestinationCardSurfaceClasses = (isHighlighted: boolean) => (
  isHighlighted
    ? `${themeColors.interactive.highlightedPanel} ${themeColors.interactive.highlightedBorder}`
    : `${themeColors.panel.secondary} ${themeColors.border.secondary} ${themeColors.interactive.hoverPanel} ${themeColors.interactive.hoverBorder}`
);

const DestinationIcon = ({ category }: { category: MapIconCategory }) => (
  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center">
    <img
      src={getMapIconSrc(category)}
      alt=""
      aria-hidden="true"
      className="h-9 w-9 object-contain"
    />
  </span>
);

function DestinationDescription({ description }: { description?: string | null }) {
  if (!description?.trim()) {
    return null;
  }

  return (
    <div className="mt-2 mb-2">
      <p className={`text-xs ${themeColors.text.secondary}`}>
        {formatDescriptionPreview(description)}
      </p>
    </div>
  );
}

function DestinationCoordinates({
  world,
  coordinates,
  address,
}: {
  world: string;
  coordinates: { x: number; y: number; z: number };
  address?: string | null;
}) {
  return (
    <div className="flex items-center gap-2 mt-1">
      <span className={getWorldBadge(world)}>
        {world}
      </span>
      <span className={`text-xs ${themeColors.text.tertiary} ${themeColors.transition}`}>
        {coordinates.x}, {coordinates.y}, {coordinates.z}
      </span>
      {world === 'nether' && address && (
        <span className={`text-xs ${themeColors.text.tertiary} ${themeColors.transition} ml-auto`}>
          {address}
        </span>
      )}
    </div>
  );
}

export function PlaceDestinationCard({ place, actions }: { place: Place; actions: DestinationCardActions }) {
  const isSelected = actions.selectedId === place.id;
  const isHighlighted = actions.shouldHighlightDestination &&
    actions.highlightedDestination?.type === 'place' &&
    actions.highlightedDestination.id === place.id;
  const category = isPlaceCategory(place.category) ? place.category : DEFAULT_PLACE_CATEGORY;

  return (
    <div
      ref={(element) => actions.setCardRef(`place-${place.id}`, element)}
      key={place.id}
      onMouseEnter={actions.onMouseEnter}
      onClick={() => actions.onDestinationClick(place.id, 'place', place.world, 'mouse')}
      className={`relative group px-4 pb-4 pt-3 ${themeColors.util.roundedLg} cursor-pointer ${themeColors.transitionAll} ${themeColors.selection.place.hover} ${
        isSelected ? themeColors.selection.place.active : `border ${getDestinationCardSurfaceClasses(isHighlighted)}`
      } ${isHighlighted ? themeColors.selection.place.halo : ''}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <DestinationIcon category={category} />
          <div className={`min-w-0 flex-1 font-medium ${themeColors.text.primary} ${themeColors.interactive.groupHoverText} ${themeColors.transition}`}>
            {place.name}
          </div>
        </div>
        <IconActionButton
          onClick={(event) => actions.onInfoClick(event, place, 'place')}
          className="ml-2 mt-1 flex-shrink-0"
          borderTone="secondary"
          aria-label="Plus d'informations"
        >
          <PlusIcon className={`w-4 h-4 ${themeColors.text.secondary}`} />
        </IconActionButton>
      </div>
      {isSelected && <DestinationDescription description={place.description} />}
      <DestinationCoordinates world={place.world} coordinates={place.coordinates} address={place.address} />
      {place.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {place.tags.map((tag) => (
            <span
              key={tag}
              className={`inline-block ${themeColors.tag.display} text-xs px-2 py-1 ${themeColors.util.roundedFull} ${themeColors.transition}`}
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export function PortalDestinationCard({ portal, actions }: { portal: Portal; actions: DestinationCardActions }) {
  const isSelected = actions.selectedId === portal.id;
  const isHighlighted = actions.shouldHighlightDestination &&
    actions.highlightedDestination?.type === 'portal' &&
    actions.highlightedDestination.id === portal.id;
  const displayDescription = portal.description?.trim()
    ? portal.description
    : portal['nether-associate']?.description?.trim() || '';

  return (
    <div
      ref={(element) => actions.setCardRef(`portal-${portal.id}`, element)}
      key={portal.id}
      onMouseEnter={actions.onMouseEnter}
      onClick={() => actions.onDestinationClick(portal.id, 'portal', portal.world, 'mouse')}
      className={`relative group px-4 pb-4 pt-3 ${themeColors.util.roundedLg} cursor-pointer ${themeColors.transitionAll} ${themeColors.selection.portal.hover} ${
        isSelected ? themeColors.selection.portal.active : `border ${getDestinationCardSurfaceClasses(isHighlighted)}`
      } ${isHighlighted ? themeColors.selection.portal.halo : ''}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <DestinationIcon category="portail" />
          <div className={`min-w-0 flex-1 font-medium ${themeColors.text.primary} ${themeColors.interactive.groupHoverText} ${themeColors.transition}`}>
            {portal.name}
          </div>
        </div>
        <IconActionButton
          onClick={(event) => actions.onInfoClick(event, portal, 'portal')}
          className="ml-2 mt-1 flex-shrink-0"
          borderTone="secondary"
          aria-label="Plus d'informations"
        >
          <PlusIcon className={`w-4 h-4 ${themeColors.text.secondary}`} />
        </IconActionButton>
      </div>
      {isSelected && <DestinationDescription description={displayDescription} />}
      <DestinationCoordinates world={portal.world} coordinates={portal.coordinates} address={portal.address} />
      {portal['nether-associate'] && (
        <div className={`mt-2 pt-2 border-t ${themeColors.border.primary} ${themeColors.transition}`}>
          <DestinationCoordinates
            world="nether"
            coordinates={portal['nether-associate'].coordinates}
            address={portal['nether-associate'].address}
          />
        </div>
      )}
    </div>
  );
}

