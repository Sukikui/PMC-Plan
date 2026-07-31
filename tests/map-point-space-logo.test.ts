import { buildWorldMapPoints } from '@/components/map/hooks/useOverworldMapPoints';
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
    const expectedLogo = {
      color: space.color,
      logoBackground: space.logoBackground,
      logoSrc: space.logoUrl,
      logoZoom: space.logoZoom,
      name: space.name,
    };

    expect(placePoint?.spaceLogo).toEqual(expectedLogo);
    expect(portalPoint?.spaceLogo).toEqual(expectedLogo);
  });

  it('uses the colored initial when the space has no image', () => {
    const point = buildWorldMapPoints(
      [{ ...mockPlaces[0], space: { ...space, logoUrl: null } }],
      [],
      'overworld',
    )[0];

    expect(point?.spaceLogo).toMatchObject({
      color: space.color,
      logoSrc: null,
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
});
