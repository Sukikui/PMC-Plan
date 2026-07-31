import { getMapSafeArea } from '../components/map/core/map-panels';
import { getRouteView } from '../components/map/core/map-route-view';
import type { MapMetadata } from '../lib/map/metadata';

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

describe('map route view', () => {
  it('reserves horizontal space for the visible side panels', () => {
    const safeArea = getMapSafeArea(
      { width: 1200, height: 800 },
      [
        { left: 16, right: 400, top: 16, bottom: 700, width: 384, height: 684 },
        { left: 864, right: 1184, top: 16, bottom: 240, width: 320, height: 224 },
      ]
    );

    expect(safeArea.left).toBe(424);
    expect(safeArea.right).toBe(840);
  });

  it('reserves vertical space for the route controls', () => {
    const safeArea = getMapSafeArea(
      { width: 1200, height: 800 },
      [
        { left: 450, right: 750, top: 716, bottom: 780, width: 300, height: 64 },
      ]
    );

    expect(safeArea.bottom).toBe(692);
  });

  it('centers the route in the available map area', () => {
    const view = getRouteView({
      points: [{ x: 25, z: 50 }, { x: 75, z: 50 }],
      metadata,
      viewport: { width: 1200, height: 800 },
      baseSize: { width: 800, height: 800 },
      safeArea: { left: 400, right: 1100, top: 40, bottom: 760 },
      maxZoom: 20,
      clampPan: (pan) => pan,
    });

    expect(view).not.toBeNull();
    expect(view!.zoom).toBeCloseTo(1.53);
    expect(view!.pan.x).toBeCloseTo(150);
    expect(view!.pan.y).toBeCloseTo(0);
  });

  it('zooms closer as the selected route gets shorter', () => {
    const commonParams = {
      metadata,
      viewport: { width: 1200, height: 800 },
      baseSize: { width: 800, height: 800 },
      safeArea: { left: 400, right: 1100, top: 40, bottom: 760 },
      maxZoom: 20,
      clampPan: (pan: { x: number; y: number }) => pan,
    };
    const longRoute = getRouteView({
      ...commonParams,
      points: [{ x: 25, z: 50 }, { x: 75, z: 50 }],
    });
    const shortRoute = getRouteView({
      ...commonParams,
      points: [{ x: 45, z: 50 }, { x: 55, z: 50 }],
    });

    expect(shortRoute!.zoom).toBeGreaterThan(longRoute!.zoom);
    expect(shortRoute!.zoom).toBeCloseTo(2.75);
  });

  it('uses the available height for a vertical route', () => {
    const view = getRouteView({
      points: [{ x: 50, z: 25 }, { x: 50, z: 75 }],
      metadata,
      viewport: { width: 1200, height: 800 },
      baseSize: { width: 800, height: 800 },
      safeArea: { left: 400, right: 1100, top: 40, bottom: 760 },
      maxZoom: 20,
      clampPan: (pan) => pan,
    });

    expect(view!.zoom).toBeCloseTo(1.58);
  });

  it('applies the same factor to each world-specific focus zoom', () => {
    const higherResolutionMetadata: MapMetadata = {
      ...metadata,
      overview: {
        ...metadata.overview,
        width: 200,
      },
    };
    const view = getRouteView({
      points: [{ x: 49, z: 50 }, { x: 51, z: 50 }],
      metadata: higherResolutionMetadata,
      viewport: { width: 1200, height: 800 },
      baseSize: { width: 800, height: 800 },
      safeArea: { left: 400, right: 1100, top: 40, bottom: 760 },
      maxZoom: 20,
      clampPan: (pan) => pan,
    });

    expect(view!.zoom).toBeCloseTo(5.5);
  });
});
