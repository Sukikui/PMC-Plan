import { getVisibleMapTiles } from '../components/map/core/map-tiles';
import {
  getMapWorldBounds,
  getMapWorldSize,
  mapMetadataByWorld,
} from '../lib/map/metadata';

describe('tiled map metadata', () => {
  it('normalizes overview-only and tiled asset paths', () => {
    expect(mapMetadataByWorld.overworld.overview.image).toBe(
      '/map/overworld/biomes-16-light.png'
    );
    expect(mapMetadataByWorld.nether.overview.image).toBe(
      '/map/nether/overview.png'
    );
    expect(mapMetadataByWorld.nether.tiles?.directory).toBe('/map/nether/tiles');
  });

  it('uses the padded Nether raster bounds', () => {
    expect(getMapWorldSize(mapMetadataByWorld.nether)).toEqual({
      width: 20016,
      height: 20016,
    });
    expect(getMapWorldBounds(mapMetadataByWorld.nether)).toEqual({
      minX: -10000,
      minZ: -10000,
      maxX: 10015,
      maxZ: 10015,
    });
  });
});

describe('visible map tiles', () => {
  const tiles = mapMetadataByWorld.nether.tiles!;

  it('loads the visible area with one tile of overscan', () => {
    const visibleTiles = getVisibleMapTiles(
      tiles,
      { width: 1000, height: 1000 },
      { left: 0, top: 0, width: 5004, height: 5004 }
    );

    expect(visibleTiles).toHaveLength(9);
    expect(visibleTiles[0]).toMatchObject({ column: 0, row: 0 });
    expect(visibleTiles[8]).toMatchObject({ column: 2, row: 2 });
  });

  it('returns the real dimensions of partial edge tiles', () => {
    const visibleTiles = getVisibleMapTiles(
      tiles,
      { width: 5004, height: 5004 },
      { left: 0, top: 0, width: 5004, height: 5004 }
    );
    const finalTile = visibleTiles.find((tile) => tile.column === 9 && tile.row === 9);

    expect(visibleTiles).toHaveLength(100);
    expect(finalTile).toEqual({
      column: 9,
      row: 9,
      src: '/map/nether/tiles/9-9.png',
      width: 396,
      height: 396,
    });
  });

  it('returns no tiles when the map is outside the viewport', () => {
    expect(getVisibleMapTiles(
      tiles,
      { width: 1000, height: 1000 },
      { left: 1200, top: 0, width: 5004, height: 5004 }
    )).toEqual([]);
  });
});
