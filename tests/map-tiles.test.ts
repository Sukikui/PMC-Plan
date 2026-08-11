import { getVisibleMapTiles } from '../components/map/core/map-tiles';
import {
  getMapWorldSize,
  mapMetadataByWorld,
  type MapWorld,
} from '../lib/map/metadata';

describe('tiled map metadata', () => {
  it.each(['overworld', 'nether'] satisfies MapWorld[])(
    'normalizes and aligns %s overview and tile assets',
    (world) => {
      const metadata = mapMetadataByWorld[world];
      const tiles = metadata.tiles;

      expect(metadata.overview.image).toBe(`/map/${world}/overview.png`);
      expect(tiles.directory).toBe(`/map/${world}/tiles`);
      expect(getMapWorldSize(metadata)).toEqual({
        width: tiles.width * tiles.cellSize,
        height: tiles.height * tiles.cellSize,
      });
      expect(tiles.columns).toBe(Math.ceil(tiles.width / tiles.tileSize));
      expect(tiles.rows).toBe(Math.ceil(tiles.height / tiles.tileSize));
    }
  );

  it('uses the expected padded raster sizes', () => {
    expect(getMapWorldSize(mapMetadataByWorld.overworld)).toEqual({
      width: 28672,
      height: 14336,
    });
    expect(getMapWorldSize(mapMetadataByWorld.nether)).toEqual({
      width: 20016,
      height: 20016,
    });
  });
});

describe('visible map tiles', () => {
  const tiles = mapMetadataByWorld.nether.tiles;

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

  it.each([
    {
      world: 'overworld' as const,
      finalColumn: 13,
      finalRow: 6,
      finalWidth: 512,
      finalHeight: 512,
      tileCount: 98,
    },
    {
      world: 'nether' as const,
      finalColumn: 9,
      finalRow: 9,
      finalWidth: 396,
      finalHeight: 396,
      tileCount: 100,
    },
  ])('returns the real dimensions of $world edge tiles', ({
    world,
    finalColumn,
    finalRow,
    finalWidth,
    finalHeight,
    tileCount,
  }) => {
    const worldTiles = mapMetadataByWorld[world].tiles;
    const visibleTiles = getVisibleMapTiles(
      worldTiles,
      { width: worldTiles.width, height: worldTiles.height },
      { left: 0, top: 0, width: worldTiles.width, height: worldTiles.height }
    );
    const finalTile = visibleTiles.find((tile) => (
      tile.column === finalColumn && tile.row === finalRow
    ));

    expect(visibleTiles).toHaveLength(tileCount);
    expect(finalTile).toEqual({
      column: finalColumn,
      row: finalRow,
      src: `/map/${world}/tiles/${finalColumn}-${finalRow}.png`,
      width: finalWidth,
      height: finalHeight,
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
