import {
  getActiveRoutePointState,
  getRouteLabelPoints,
} from '../components/map/core/map-route-target';
import type { ScreenMapPoint } from '../components/map/core/map-types';
import type { MapMetadata } from '../lib/map/metadata';
import type { MapRouteMarker, MapRouteSegment } from '../lib/map/route-path';

describe('active map route points', () => {
  it('keeps both portal endpoints visible for an intermediate segment', () => {
    const segment = createSegment(1);
    const state = getActiveRoutePointState(
      [segment],
      [createMarker(segment, 'transition')],
      [
        createPoint('place-at-source', 0, 0, 'place'),
        createPoint('portal-nether-source', 0, 0, 'portal-nether'),
        createPoint('portal-nether-target', 10, 10, 'portal-nether'),
        createPoint('unrelated-place', 20, 20, 'place'),
      ]
    );

    expect(state.targetPoint?.id).toBe('portal-nether-target');
    expect(Array.from(state.pointIds ?? [])).toEqual([
      'portal-nether-source',
      'portal-nether-target',
    ]);
  });

  it('does not treat the player origin as a route map point', () => {
    const segment = createSegment(0);
    const state = getActiveRoutePointState(
      [segment],
      [createMarker(segment, 'start')],
      [
        createPoint('place-at-player', 0, 0, 'place'),
        createPoint('portal-nether-target', 10, 10, 'portal-nether'),
      ]
    );

    expect(Array.from(state.pointIds ?? [])).toEqual(['portal-nether-target']);
    const labelPoints = getRouteLabelPoints(segment, state, {
      metadata,
      viewport: { width: 100, height: 100 },
      baseSize: { width: 100, height: 100 },
      pan: { x: 0, y: 0 },
      zoom: 1,
    });
    expect(labelPoints.map((point) => point.label)).toEqual(['Portail cible']);
    expect(labelPoints[0].kind).toBe('portal-nether');
  });
});

const metadata: MapMetadata = {
  selectionMin: { x: 0, z: 0 },
  selectionMax: { x: 100, z: 100 },
  gridOrigin: { x: 0, z: 0 },
  overview: {
    image: '',
    width: 100,
    height: 100,
    cellSize: 1,
  },
};

const createSegment = (sequence: number): MapRouteSegment => ({
  id: `route-segment-${sequence}`,
  world: 'nether',
  points: [{ x: 0, z: 0 }, { x: 10, z: 10 }],
  sequence,
  source: {
    ...(sequence > 0 ? { id: 'source' } : {}),
    label: sequence > 0 ? 'Portail source' : 'Position du joueur',
  },
  target: {
    id: 'target',
    label: 'Portail cible',
    kind: 'portal',
  },
});

const createMarker = (
  segment: MapRouteSegment,
  kind: MapRouteMarker['kind']
): MapRouteMarker => ({
  id: `${segment.id}-start`,
  world: segment.world,
  point: segment.points[0],
  kind,
  sequence: segment.sequence,
});

const createPoint = (
  id: string,
  x: number,
  z: number,
  kind: ScreenMapPoint['kind']
): ScreenMapPoint => ({
  id,
  x,
  z,
  kind,
  screen: { left: x, top: z },
});
