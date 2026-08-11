import {
  convertOverworldCoordinatesToNether,
  convertOverworldToNether,
} from '@/lib/nether-coordinates';

describe('Nether coordinates', () => {
  it('divides X and Z by eight while preserving Y', () => {
    expect(convertOverworldCoordinatesToNether({ x: 800, y: 72, z: 1600 })).toEqual({
      x: 100,
      y: 72,
      z: 200,
    });
  });

  it('floors negative horizontal coordinates to Minecraft block coordinates', () => {
    expect(convertOverworldToNether(-1, -9)).toEqual({ x: -1, z: -2 });
  });
});
