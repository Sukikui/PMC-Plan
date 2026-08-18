import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  PlaceDestinationCard,
  PortalDestinationCard,
} from '@/components/destination/DestinationCards';
import type { DestinationCardActions } from '@/components/destination/destination-panel-types';
import { resolveDestinationActivation } from '@/lib/destination/selection';
import type { PlaceSummary, PortalSummary } from '@/lib/map-content/types';

const place: PlaceSummary = {
  color: '#3B82F6',
  id: 'place-1',
  mapEntryId: 'entry-place-1',
  name: 'Place test',
  world: 'overworld',
  coordinates: { x: 10, y: 64, z: 20 },
  description: 'Description du lieu.',
  address: null,
  category: 'construction',
  tags: [],
  space: null,
  previewImage: null,
};

const portal: PortalSummary = {
  color: '#3B82F6',
  id: 'portal-1',
  mapEntryId: 'entry-portal-1',
  slug: 'portail-test',
  name: 'Portail test',
  world: 'overworld',
  coordinates: { x: 30, y: 70, z: 40 },
  description: 'Description du portail.',
  address: '',
  space: null,
  'nether-associate': null,
};

function createActions(selectedId?: string): DestinationCardActions {
  return {
    selectedId,
    highlightedDestination: null,
    shouldHighlightDestination: false,
    setCardRef: jest.fn(),
    onMouseEnter: jest.fn(),
    onDestinationClick: jest.fn(),
    onInfoClick: jest.fn(),
    onCloseClick: jest.fn(),
  };
}

describe('destination card actions', () => {
  it('shows the close action only for a selected place', () => {
    const selectedMarkup = renderToStaticMarkup(createElement(
      PlaceDestinationCard,
      { place, actions: createActions(place.id) },
    ));
    const unselectedMarkup = renderToStaticMarkup(createElement(
      PlaceDestinationCard,
      { place, actions: createActions() },
    ));

    expect(selectedMarkup).toContain('aria-label="Fermer"');
    expect(selectedMarkup).not.toContain('Plus d');
    expect(unselectedMarkup).not.toContain('aria-label="Fermer"');
    expect(unselectedMarkup).toContain('Plus d');
  });

  it('shows the close action for a selected portal', () => {
    const markup = renderToStaticMarkup(createElement(
      PortalDestinationCard,
      { portal, actions: createActions(portal.id) },
    ));

    expect(markup).toContain('aria-label="Fermer"');
    expect(markup).not.toContain('Plus d');
  });

  it('keeps mouse and keyboard activation behaviors distinct', () => {
    expect(resolveDestinationActivation('mouse', place.id, place.id)).toBe('open-info');
    expect(resolveDestinationActivation('keyboard', place.id, place.id)).toBe('clear-selection');
    expect(resolveDestinationActivation('keyboard', undefined, place.id)).toBe('select');
  });
});
