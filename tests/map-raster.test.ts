import { getClippedImageDraw } from '@/components/map/layers/map-raster';

describe('map raster clipping', () => {
  it('keeps an image already contained in the viewport unchanged', () => {
    expect(getClippedImageDraw(
      { width: 512, height: 512 },
      { left: 100, top: 50, width: 512, height: 512 },
      { width: 800, height: 600 }
    )).toEqual({
      source: { left: 0, top: 0, width: 512, height: 512 },
      destination: { left: 100, top: 50, width: 512, height: 512 },
    });
  });

  it('only draws the source region visible at high zoom', () => {
    expect(getClippedImageDraw(
      { width: 512, height: 512 },
      { left: -10000, top: -5000, width: 20000, height: 20000 },
      { width: 1000, height: 800 }
    )).toEqual({
      source: { left: 256, top: 128, width: 25.6, height: 20.48 },
      destination: { left: 0, top: 0, width: 1000, height: 800 },
    });
  });

  it('skips images outside the viewport', () => {
    expect(getClippedImageDraw(
      { width: 512, height: 512 },
      { left: 1200, top: 900, width: 512, height: 512 },
      { width: 1000, height: 800 }
    )).toBeNull();
  });
});
