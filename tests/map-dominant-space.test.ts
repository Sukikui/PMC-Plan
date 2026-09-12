import { findDominantMapSpace } from '@/components/map/core/dominant-space';
import type { ScreenMapPoint } from '@/components/map/core/map-types';
import type { SpaceReference } from '@/lib/spaces/types';

const viewport = { width: 1000, height: 800 };
const valnyfrost = createSpace('valnyfrost', 'Valnyfrost');
const spawn = createSpace('spawn', 'Spawn');

describe('dominant map space', () => {
  it('returns the most represented space in the central viewport region', () => {
    expect(findDominantMapSpace([
      createPoint('v-1', 400, 350, valnyfrost),
      createPoint('v-2', 600, 450, valnyfrost),
      createPoint('s-1', 500, 400, spawn),
      createPoint('outside', 50, 50, spawn),
    ], viewport)).toEqual(valnyfrost);
  });

  it('requires at least two points and a unique leading space', () => {
    expect(findDominantMapSpace([
      createPoint('v-1', 400, 350, valnyfrost),
    ], viewport)).toBeNull();

    expect(findDominantMapSpace([
      createPoint('v-1', 400, 350, valnyfrost),
      createPoint('v-2', 600, 450, valnyfrost),
      createPoint('s-1', 450, 350, spawn),
      createPoint('s-2', 550, 450, spawn),
    ], viewport)).toBeNull();
  });

  it('ignores points without a space and points outside the central region', () => {
    expect(findDominantMapSpace([
      createPoint('v-1', 225, 400, valnyfrost),
      createPoint('v-2', 775, 400, valnyfrost),
      createPoint('standalone', 500, 400),
    ], viewport)).toBeNull();
  });
});

function createSpace(id: string, name: string): SpaceReference {
  return {
    id,
    slug: id,
    color: '#1F2A65',
    discordUrl: null,
    logoBackground: 'color',
    logoUrl: null,
    logoZoom: 1,
    name,
  };
}

function createPoint(
  id: string,
  left: number,
  top: number,
  spaceLogo?: SpaceReference,
): ScreenMapPoint {
  return {
    id,
    x: 0,
    z: 0,
    kind: 'place',
    label: id,
    screen: { left, top },
    spaceLogo,
  };
}
