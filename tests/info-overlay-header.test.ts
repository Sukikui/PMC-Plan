import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import InfoOverlayHeader from '@/components/info-overlay/InfoOverlayHeader';
import type { PortalSummary } from '@/lib/map-content/types';

const linkedPortal: PortalSummary = {
  address: '',
  color: '#3B82F6',
  coordinates: { x: 80, y: 64, z: 160 },
  description: null,
  id: 'portal-overworld',
  mapEntryId: 'entry-portal',
  name: 'Portail test',
  'nether-associate': {
    address: '',
    coordinates: { x: 10, y: 71, z: 20 },
    description: null,
  },
  previewImage: null,
  slug: 'portail-test',
  space: null,
  unidentified: false,
  world: 'overworld',
};

describe('InfoOverlayHeader', () => {
  it('exposes both linked portal coordinate sets as map destinations', () => {
    const markup = renderToStaticMarkup(createElement(InfoOverlayHeader, {
      canEdit: false,
      iconCategory: 'portail',
      item: linkedPortal,
      onClose: jest.fn(),
      onEdit: jest.fn(),
      onOpenSpace: jest.fn(),
      onSelectItem: jest.fn(),
      type: 'portal',
    }));

    expect(markup).toContain('aria-label="Afficher ces coordonnées dans l&#x27;Overworld"');
    expect(markup).toContain('aria-label="Afficher ces coordonnées dans le Nether"');
    expect(markup).toContain('80, 64, 160');
    expect(markup).toContain('10, 71, 20');
  });
});
