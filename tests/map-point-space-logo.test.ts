import { buildWorldMapPoints } from '@/components/map/hooks/useOverworldMapPoints';
import { hideDominantSpaceLogos } from '@/components/map/tooltip/map-tooltip';
import type { MapTooltip } from '@/components/map/core/map-types';
import type { SpaceReference } from '@/lib/spaces/types';
import { mockPlaces, mockPortals } from './mock-data';

const space: SpaceReference = {
  id: 'space-valnyfrost',
  slug: 'valnyfrost',
  name: 'Valnyfrost',
  color: '#1F2A65',
  logoUrl: 'https://example.com/valnyfrost.png',
  logoBackground: 'transparent',
  logoZoom: 1.4,
  discordUrl: null,
};

describe('map point space logos', () => {
  it('exposes a space logo for places and portals that define one', () => {
    const placePoint = buildWorldMapPoints(
      [{ ...mockPlaces[0], space }],
      [],
      'overworld',
    )[0];
    const portalPoint = buildWorldMapPoints(
      [],
      mockPortals.slice(0, 2).map((portal) => ({ ...portal, space })),
      'overworld',
    )[0];
    expect(placePoint?.spaceLogo).toEqual(space);
    expect(portalPoint?.spaceLogo).toEqual(space);
  });

  it('uses the colored initial when the space has no image', () => {
    const point = buildWorldMapPoints(
      [{ ...mockPlaces[0], space: { ...space, logoUrl: null } }],
      [],
      'overworld',
    )[0];

    expect(point?.spaceLogo).toMatchObject({
      color: space.color,
      logoUrl: null,
      name: space.name,
    });
  });

  it('does not create a tooltip logo when no space is associated', () => {
    const point = buildWorldMapPoints(
      [{ ...mockPlaces[0], space: null }],
      [],
      'overworld',
    )[0];

    expect(point?.spaceLogo).toBeUndefined();
  });

  it('uses the content color without a space and the space color otherwise', () => {
    const contentColor = '#10B981';
    const standalonePoint = buildWorldMapPoints(
      [{ ...mockPlaces[0], color: contentColor, space: null }],
      [],
      'overworld',
    )[0];
    const associatedPoint = buildWorldMapPoints(
      [{ ...mockPlaces[0], color: contentColor, space }],
      [],
      'overworld',
    )[0];

    expect(standalonePoint?.markerColor).toBe(contentColor);
    expect(associatedPoint?.markerColor).toBe(space.color);
  });

  it('hides a dominant space logo only from non-interactive automatic labels', () => {
    const automatic = createTooltip({ automatic: true });
    const hovered = createTooltip({ automatic: true, automaticPriority: true });
    const explicit = createTooltip({});

    const displayed = hideDominantSpaceLogos(
      [automatic, hovered, explicit],
      space.id,
    );

    expect(displayed[0]?.spaceLogo).toBeUndefined();
    expect(displayed[1]?.spaceLogo).toBeDefined();
    expect(displayed[2]?.spaceLogo).toBeDefined();
  });
});

function createTooltip(overrides: Partial<MapTooltip>): MapTooltip {
  return {
    pointId: 'place-overworld-market',
    pointLeft: 100,
    pointTop: 100,
    offset: 12,
    label: 'Marché',
    expanded: false,
    spaceLogo: space,
    ...overrides,
  };
}
