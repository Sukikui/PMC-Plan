import {
  convertNetherCoordinateFieldsToOverworld,
  convertOverworldCoordinateFieldsToNether,
  convertOverworldToNether,
} from '@/lib/nether-coordinates';

describe('Nether coordinates', () => {
  it('floors negative horizontal coordinates to Minecraft block coordinates', () => {
    expect(convertOverworldToNether(-1, -9)).toEqual({ x: -1, z: -2 });
  });

  it('converts each available Overworld field independently', () => {
    expect(convertOverworldCoordinateFieldsToNether({
      x: '80',
      y: '',
      z: '-9',
    })).toEqual({
      x: '10',
      y: '',
      z: '-2',
    });
  });

  it('converts each available Nether field independently', () => {
    expect(convertNetherCoordinateFieldsToOverworld({
      x: '10',
      y: '71',
      z: '',
    })).toEqual({
      x: '80',
      y: '71',
      z: '',
    });
  });
});
