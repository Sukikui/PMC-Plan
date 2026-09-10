import {
  getMapBlockPixelSize,
  getMapGridCellAtScreenPosition,
} from '@/components/map/core/map-grid';
import type { MapDrawRect } from '@/components/map/core/map-geometry';
import { getMaxZoom } from '@/components/map/core/map-view';
import type { MapMetadata } from '@/lib/map/metadata';

const metadata: MapMetadata = {
  selectionMin: { x: -9, z: -19 },
  selectionMax: { x: 8, z: -12 },
  gridOrigin: { x: -10, z: -20 },
  overview: {
    image: '/overview.png',
    width: 10,
    height: 5,
    cellSize: 2,
  },
  tiles: {
    directory: '/tiles',
    filePattern: '{column}-{row}.png',
    width: 20,
    height: 10,
    cellSize: 1,
    tileSize: 10,
    columns: 2,
    rows: 1,
  },
};

const drawRect: MapDrawRect = {
  left: 100,
  top: 50,
  width: 200,
  height: 100,
};

describe('map grid geometry', () => {
  it('derives the rendered size of one Minecraft block', () => {
    expect(getMapBlockPixelSize(metadata, drawRect)).toBe(10);
  });

  it('limits every map to the same maximum rendered block size', () => {
    expect(getMaxZoom(drawRect.width, metadata)).toBe(1.6);
  });

  it('maps a screen position to the matching Minecraft block', () => {
    expect(getMapGridCellAtScreenPosition(metadata, drawRect, {
      x: 125,
      y: 85,
    })).toEqual({
      coordinates: { x: -8, z: -17 },
      screen: { left: 120, top: 80, size: 10 },
    });
  });

  it('rejects image padding outside the exported selection', () => {
    expect(getMapGridCellAtScreenPosition(metadata, drawRect, {
      x: 105,
      y: 55,
    })).toBeNull();
  });
});
