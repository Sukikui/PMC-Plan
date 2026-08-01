import { getMapDrawRect } from '@/components/map/core/map-geometry';

describe('map canvas geometry', () => {
  it('keeps the raster aligned to whole pixels at high zoom', () => {
    const rect = getMapDrawRect(
      { width: 1000, height: 800 },
      { width: 800, height: 800 },
      4.9997,
      { x: 100.012, y: -25.008 }
    );

    expect(rect).toEqual({
      left: -1400,
      top: -1625,
      width: 4000,
      height: 4000,
    });
  });
});
