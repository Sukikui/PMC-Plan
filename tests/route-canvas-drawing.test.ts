import { clipRouteSegmentsToViewport } from '@/components/map/layers/route-canvas-drawing';
import type { ScreenRouteSegment } from '@/components/map/layers/route-canvas-drawing';

const segment = (points: { left: number; top: number }[]) => ({
  id: 'segment',
  sequence: 0,
  world: 'overworld',
  points,
  source: { kind: 'destination', label: 'Départ' },
  target: { kind: 'destination', label: 'Arrivée' },
}) as ScreenRouteSegment;

describe('route canvas viewport clipping', () => {
  const viewport = { width: 100, height: 80 };

  it('clips very large route coordinates to the visible viewport', () => {
    const result = clipRouteSegmentsToViewport([
      segment([{ left: -100_000, top: 40 }, { left: 100_000, top: 40 }]),
    ], viewport);

    expect(result).toHaveLength(1);
    expect(result[0].points[0].left).toBeCloseTo(0);
    expect(result[0].points[0].top).toBeCloseTo(40);
    expect(result[0].points[1].left).toBeCloseTo(100);
    expect(result[0].points[1].top).toBeCloseTo(40);
  });

  it('removes route sections that cannot affect the viewport', () => {
    const result = clipRouteSegmentsToViewport([
      segment([{ left: -200, top: -50 }, { left: -100, top: -20 }]),
    ], viewport);

    expect(result).toEqual([]);
  });

  it('keeps a configurable margin for route glow', () => {
    const result = clipRouteSegmentsToViewport([
      segment([{ left: -20, top: 40 }, { left: 120, top: 40 }]),
    ], viewport, 10);

    expect(result[0].points).toEqual([
      { left: -10, top: 40 },
      { left: 110, top: 40 },
    ]);
  });
});
