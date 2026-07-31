# Map Image Format

This document defines the image asset format used for PMC Plan maps. The convention is world-independent and does not assume any fixed Minecraft coordinates or map dimensions.

## General Principle

The complete format has two image levels:

- one `overview.png` image representing the entire map at low resolution;
- one `tiles/` directory containing the high-resolution map split into tiles.

The overview is always required. The tile level may be omitted while a world's
high-resolution assets are not yet available; the metadata structure remains
the same and the application renders the overview alone.

The complete high-resolution image is only an intermediate generation asset. It is replaced by the tiles in the final map assets.

## Image Format

The overview and all tiles use the lossless PNG format with the `.png` extension. JPEG must not be used because its lossy compression can alter colors and introduce blocking or ringing artifacts around biome boundaries.

The overview uses RGB PNG with 24-bit color. It must not be converted to an indexed palette because the downsampling process creates intermediate transition colors that must be preserved accurately.

Tiles always use indexed 8-bit PNG. A single global palette is derived from the complete high-resolution raster and shared by every tile in the world. Palette conversion must preserve every source color exactly. Asset generation must fail instead of silently quantizing colors when the source contains more than 256 unique colors.

Tiles must preserve the source pixels exactly and must not be resampled. The overview is the only reduced asset and must use the downsampling process defined below.

## Asset Generation

The overview and tiles must be generated from the same high-resolution raster source. This source is produced from map data at the tile resolution of `1 pixel = 4 x 4 blocks`.

The generation sequence is:

1. Generate the complete high-resolution raster from the map data.
2. Split that raster directly into tiles without resizing or filtering it.
3. Derive the overview from the same complete raster by reducing its width and height by a factor of four.
4. Store the overview and tiles using their respective PNG formats.

A separate low-resolution render must not be used for the overview. Deriving both asset levels from the same raster guarantees matching coordinates, boundaries, and source colors.

## Overview Downsampling

The overview is generated with a Lanczos3 downsampling filter. The reduction is performed once, directly from the complete high-resolution dimensions to the final overview dimensions.

Color processing follows this sequence:

1. Convert source colors from sRGB to linear RGB.
2. Reduce the image by a factor of four on both axes using Lanczos3.
3. Convert the result from linear RGB back to sRGB.
4. Encode the result as a 24-bit RGB PNG.

Lanczos3 provides anti-aliasing while preserving boundaries and small details more accurately than nearest-neighbor, bilinear, or simple box averaging. Linear-light processing prevents transition colors from becoming artificially dark during downsampling.

The overview must not receive additional sharpening, lossy compression, or palette quantization after downsampling.

## Coordinate Reference

Every map defines its own top-left grid origin:

```text
gridOriginX
gridOriginZ
```

This origin is the Minecraft coordinate represented by the top-left corner of the overview and the first tile. It does not need to be `X=0, Z=0`, and the Minecraft origin may be located anywhere within or outside the map.

Image columns progress toward positive X coordinates. Image rows progress toward positive Z coordinates.

The overview and the tile set must use the same grid origin and cover the same world area.

## Overview

The overview uses the following resolution:

```text
1 pixel = 16 x 16 blocks
```

Its dimensions depend on the total rasterized size of the world map:

```text
overview width  = map width in blocks / 16
overview height = map height in blocks / 16
```

The map width and height used for image generation must be aligned to complete 16-block cells. When the selected world area does not end on that boundary, the rasterized area extends to the next complete cell.

## High-Resolution Tiles

The high-resolution map uses the following resolution:

```text
1 pixel = 4 x 4 blocks
```

It is split from the top-left grid origin into tiles with a maximum size of:

```text
512 x 512 pixels
```

Each complete tile therefore represents:

```text
2048 x 2048 blocks
```

The required tile grid is calculated from the high-resolution image dimensions:

```text
column count = round up(high-resolution width / 512)
row count    = round up(high-resolution height / 512)
tile count   = column count x row count
```

Tiles on the final column or final row may be smaller than `512 x 512 pixels` when the map dimensions are not exactly divisible by 512. They contain only the remaining map pixels and are not padded beyond the map bounds.

The final number of image files for one world is:

```text
1 overview + tile count
```

The world directory also contains one `metadata.json` file, which is not included in the image count.

## Tile Origin and Direction

Tile indices start at `0-0` in the top-left corner of the map:

- columns are numbered from left to right;
- rows are numbered from top to bottom;
- both indices start at zero.

The tile at column `C` and row `R` starts at the following Minecraft coordinates:

```text
tile minimum X = gridOriginX + C x 2048
tile minimum Z = gridOriginZ + R x 2048
```

The `0-0` index is a tile-grid index. It must not be interpreted as Minecraft coordinates `X=0, Z=0`.

## Naming Convention

Each tile name follows this format:

```text
{column}-{row}.png
```

For example:

- `0-0.png` is the top-left tile;
- `1-0.png` is the next tile to its right;
- `0-1.png` is the next tile below it.

## File Organization

Each world stores its metadata and images in a dedicated directory identified by its world ID:

```text
public/map/
└── {world-id}/
    ├── metadata.json
    ├── overview.png
    └── tiles/
        ├── 0-0.png
        ├── 1-0.png
        ├── 0-1.png
        └── ...
```

All worlds follow this same convention regardless of their coordinates,
dimensions, or total tile count. The `tiles/` directory is absent for an
overview-only world.

## World Metadata

Each world directory contains a `metadata.json` file describing the coordinate bounds and dimensions of its image assets. Paths are relative to the world directory.

The following file uses illustrative values only. Every world provides its own coordinates and dimensions while preserving the same structure:

```json
{
  "formatVersion": 1,
  "selectionMin": {
    "x": -4096,
    "z": -2048
  },
  "selectionMax": {
    "x": 4095,
    "z": 2047
  },
  "gridOrigin": {
    "x": -4096,
    "z": -2048
  },
  "fallbackBackground": "#202020",
  "overview": {
    "image": "overview.png",
    "width": 512,
    "height": 256,
    "cellSize": 16
  },
  "tiles": {
    "directory": "tiles",
    "filePattern": "{column}-{row}.png",
    "width": 2048,
    "height": 1024,
    "cellSize": 4,
    "tileSize": 512,
    "columns": 4,
    "rows": 2
  }
}
```

The metadata fields have the following meaning:

- `formatVersion`: version of this asset format;
- `selectionMin` and `selectionMax`: inclusive Minecraft coordinate bounds selected for the map;
- `gridOrigin`: Minecraft coordinate represented by the top-left image corner;
- `fallbackBackground`: optional fallback color displayed when map images are unavailable;
- `overview.image`: overview path relative to the world directory;
- `overview.width` and `overview.height`: overview dimensions in pixels;
- `overview.cellSize`: overview resolution in Minecraft blocks per pixel;
- `tiles`: optional high-resolution tile configuration;
- `tiles.directory`: tile directory relative to the world directory;
- `tiles.filePattern`: tile naming convention;
- `tiles.width` and `tiles.height`: complete high-resolution raster dimensions in pixels;
- `tiles.cellSize`: tile resolution in Minecraft blocks per pixel;
- `tiles.tileSize`: maximum tile width and height in pixels;
- `tiles.columns` and `tiles.rows`: dimensions of the tile grid.
