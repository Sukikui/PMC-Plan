import {
  indexLinkedPortalPairs,
  mergeLinkedPortalPair,
  normalizeLinkedPortalIdentities,
} from '@/lib/portal/linked-portals';
import { buildWorldMapPoints } from '@/components/map/hooks/useOverworldMapPoints';
import { mockPortals } from './mock-data';

describe('linked portals', () => {
  it('uses the shared map entry instead of mutable names and slugs', () => {
    const overworld = {
      ...mockPortals[0],
      id: 'renamed-overworld',
      name: 'Renamed Overworld',
    };
    const nether = {
      ...mockPortals[1],
      id: 'previous-nether',
      slug: 'previous-nether',
      name: 'Previous Nether',
    };

    const pair = indexLinkedPortalPairs([overworld, nether])
      .get(overworld.mapEntryId);

    expect(pair).toBeDefined();
    expect(mergeLinkedPortalPair(pair!)).toMatchObject({
      id: 'renamed-overworld',
      'nether-associate': {
        coordinates: nether.coordinates,
        address: nether.address,
      },
    });

    const normalized = normalizeLinkedPortalIdentities([overworld, nether]);
    expect(normalized[1]).toMatchObject({
      id: 'renamed-overworld',
      slug: overworld.slug,
      name: 'Renamed Overworld',
      world: 'nether',
    });
    expect(nether.name).toBe('Previous Nether');
  });

  it('opens a linked portal from either world as the same logical item', () => {
    const netherPoints = buildWorldMapPoints([], mockPortals, 'nether');
    const spawnPoint = netherPoints.find(
      ({ item }) => item.mapEntryId === 'portal-entry-spawn',
    );

    expect(spawnPoint?.item).toMatchObject({
      world: 'overworld',
      mapEntryId: 'portal-entry-spawn',
      'nether-associate': {
        coordinates: mockPortals[1].coordinates,
      },
    });
    expect(spawnPoint).toMatchObject({
      id: 'portal-nether-portal-entry-spawn',
      label: 'Portail du Spawn',
    });
  });

  it('uses the canonical pair name for Nether map labels', () => {
    const portals = [
      {
        ...mockPortals[0],
        name: 'Nom actuel',
      },
      {
        ...mockPortals[1],
        name: 'Ancien nom Nether',
      },
    ];

    expect(buildWorldMapPoints([], portals, 'nether')[0]?.label)
      .toBe('Nom actuel');
  });

  it('does not merge standalone portals that only share a slug', () => {
    const portals = [
      mockPortals[0],
      {
        ...mockPortals[1],
        mapEntryId: 'another-entry',
      },
    ];

    expect(indexLinkedPortalPairs(portals).size).toBe(0);
  });
});
