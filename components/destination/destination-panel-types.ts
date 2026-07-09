import type React from 'react';
import type { Place, Portal } from '@/app/api/utils/shared';
import type { DestinationType } from '@/lib/destination/selection';

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
    source?: 'keyboard' | 'mouse'
  ) => void;
  onInfoClick: (
    event: React.MouseEvent,
    item: Place | Portal,
    type: DestinationType
  ) => void;
};

