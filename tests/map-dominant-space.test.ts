import {
  getDisplayedDominantMapSpace,
  getDominantMapSpaceView,
  resolveDominantMapSpace,
  type DominantMapSpaceState,
  type DominantMapSpaceView,
} from '@/components/map/core/dominant-space';
import type { ScreenMapPoint } from '@/components/map/core/map-types';
import type { MapCameraChange } from '@/components/map/core/map-view';
import type { SpaceReference } from '@/lib/spaces/types';

const viewport = { width: 1000, height: 800 };
const centeredView: DominantMapSpaceView = {
  centerLeft: 50,
  centerTop: 50,
  horizontalRadius: 25,
  verticalRadius: 25,
  zoom: 2,
};
const zoomedView: DominantMapSpaceView = {
  ...centeredView,
  horizontalRadius: 5,
  verticalRadius: 5,
  zoom: 4,
};
const valnyfrost = createSpace('valnyfrost', 'Valnyfrost');
const spawn = createSpace('spawn', 'Spawn');
const luna = createSpace('luna', 'Luna');

describe('dominant map space', () => {
  it('acquires the unique leading space in the central viewport region', () => {
    const resolution = resolve([
      createPoint('v-1', 400, 350, valnyfrost),
      createPoint('v-2', 600, 450, valnyfrost),
      createPoint('s-1', 500, 400, spawn),
      createPoint('outside', 50, 50, spawn),
    ]);

    expect(displayed(resolution)).toEqual(valnyfrost);
    expect(resolution?.space).toEqual(valnyfrost);
  });

  it('requires at least two points and a unique leading space', () => {
    expect(resolve([
      createPoint('v-1', 400, 350, valnyfrost),
    ])).toBeNull();

    expect(resolve([
      createPoint('v-1', 400, 350, valnyfrost),
      createPoint('v-2', 600, 450, valnyfrost),
      createPoint('s-1', 450, 350, spawn),
      createPoint('s-2', 550, 450, spawn),
    ])).toBeNull();
  });

  it('never acquires a new space outside the central region', () => {
    expect(displayed(resolve([
      createPoint('v-1', 100, 100, valnyfrost),
      createPoint('v-2', 900, 700, valnyfrost),
      createPoint('standalone', 500, 400),
    ]))).toBeNull();
  });

  it('uses the complete viewport as the primary region for a map preview', () => {
    const resolution = resolveDominantMapSpace([
      createPoint('v-1', 100, 100, valnyfrost),
      createPoint('v-2', 900, 700, valnyfrost),
      createPoint('s-1', 500, 400, spawn),
    ], viewport, null, centeredView, 'programmatic', 'viewport');

    expect(displayed(resolution)).toEqual(valnyfrost);
  });

  it('does not retain a peripheral space after panning at the acquisition zoom', () => {
    const resolution = resolve([
      createPoint('v-1', 100, 100, valnyfrost),
    ], acquireValnyfrost(), centeredView, 'pan');

    expect(resolution).toBeNull();
  });

  it('does not retain a peripheral space after panning at a higher zoom', () => {
    const resolution = resolve([
      createPoint('v-1', 100, 100, valnyfrost),
    ], acquireValnyfrost(), zoomedView, 'pan');

    expect(resolution).toBeNull();
  });

  it('retains the current space after zooming while one point remains visible', () => {
    const state = acquireValnyfrost();
    const resolution = resolve([
      createPoint('v-1', 100, 100, valnyfrost),
    ], state, zoomedView, 'zoom');

    expect(displayed(resolution)).toEqual(valnyfrost);
    expect(resolution?.anchor).toEqual(state.anchor);
  });

  it('keeps dormant memory when zoom hides every point', () => {
    const state = acquireValnyfrost();
    const resolution = resolve([], state, zoomedView, 'zoom');

    expect(displayed(resolution)).toBeNull();
    expect(resolution).toEqual({ ...state, status: 'dormant' });
  });

  it('restores a dormant space as soon as one point becomes visible again', () => {
    const dormant = resolve([], acquireValnyfrost(), zoomedView, 'zoom');
    const recovered = resolve([
      createPoint('v-1', 100, 100, valnyfrost),
    ], dormant, zoomedView, 'zoom');

    expect(displayed(recovered)).toEqual(valnyfrost);
  });

  it('retains the current space during a central tie', () => {
    const resolution = resolve([
      createPoint('v-1', 400, 350, valnyfrost),
      createPoint('v-2', 600, 450, valnyfrost),
      createPoint('s-1', 450, 350, spawn),
      createPoint('s-2', 550, 450, spawn),
    ], acquireValnyfrost());

    expect(displayed(resolution)).toEqual(valnyfrost);
  });

  it('hides the current space when other central candidates are tied', () => {
    const resolution = resolve([
      createPoint('v-1', 100, 100, valnyfrost),
      createPoint('s-1', 400, 350, spawn),
      createPoint('s-2', 600, 450, spawn),
      createPoint('l-1', 450, 350, luna),
      createPoint('l-2', 550, 450, luna),
    ], acquireValnyfrost());

    expect(displayed(resolution)).toBeNull();
    expect(resolution).toBeNull();
  });

  it('switches when another space becomes the unique central winner', () => {
    const resolution = resolve([
      createPoint('v-1', 100, 100, valnyfrost),
      createPoint('s-1', 400, 350, spawn),
      createPoint('s-2', 600, 450, spawn),
    ], acquireValnyfrost());

    expect(displayed(resolution)).toEqual(spawn);
    expect(resolution?.space).toEqual(spawn);
  });

  it('forgets dormant memory after the map center leaves its anchor', () => {
    const resolution = resolve([], acquireValnyfrost(), {
      ...zoomedView,
      centerLeft: 66,
    }, 'zoom');

    expect(resolution).toBeNull();
  });

  it('does not restore dormant memory after leaving its geographic anchor', () => {
    const dormant = resolve([], acquireValnyfrost(), zoomedView);
    const resolution = resolve([
      createPoint('v-1', 100, 100, valnyfrost),
    ], dormant, {
      ...zoomedView,
      centerLeft: 66,
    }, 'zoom');

    expect(resolution).toBeNull();
  });

  it('derives a normalized geographic view from the map camera', () => {
    const view = getDominantMapSpaceView(
      viewport,
      { width: 1000, height: 800 },
      { x: -100, y: 80 },
      2,
    );

    expect(view?.centerLeft).toBeCloseTo(55);
    expect(view?.centerTop).toBeCloseTo(45);
    expect(view?.horizontalRadius).toBeCloseTo(25);
    expect(view?.verticalRadius).toBeCloseTo(25);
    expect(view?.zoom).toBe(2);
  });
});

function resolve(
  points: ScreenMapPoint[],
  state: DominantMapSpaceState | null = null,
  view: DominantMapSpaceView = centeredView,
  cameraChange: MapCameraChange = 'programmatic',
) {
  return resolveDominantMapSpace(points, viewport, state, view, cameraChange);
}

function acquireValnyfrost() {
  const state = resolve([
    createPoint('v-1', 400, 350, valnyfrost),
    createPoint('v-2', 600, 450, valnyfrost),
  ]);
  if (!state) throw new Error('Expected Valnyfrost to be acquired.');
  return state;
}

function displayed(state: DominantMapSpaceState | null) {
  return getDisplayedDominantMapSpace(state);
}

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
