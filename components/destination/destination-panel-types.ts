import type React from 'react';
import type { PlaceSummary, PortalSummary } from '@/lib/map-content/types';
import type {
  DestinationInputSource,
  DestinationType,
} from '@/lib/destination/selection';

export type TagFilterLogic = 'SINGLE' | 'OR' | 'AND';

export type DestinationListItem = {
  id: string;
  type: DestinationType;
  world: string;
};

export type DestinationCardActions = {
  selectedId?: string;
  highlightedDestination: DestinationListItem | null;
  shouldHighlightDestination: boolean;
  setCardRef: (key: string, element: HTMLDivElement | null) => void;
  onMouseEnter: () => void;
  onDestinationClick: (
    id: string,
    type: DestinationType,
    world: string,
    source?: DestinationInputSource
  ) => void;
  onInfoClick: (
    event: React.MouseEvent,
    item: PlaceSummary | PortalSummary,
    type: DestinationType
  ) => void;
  onCloseClick: (event: React.MouseEvent) => void;
};
