import {
  DEFAULT_SPACE_COLOR,
  getSpaceColorWithAlpha,
  hexToHsl,
  hslToHex,
  normalizeSpaceHexInput,
} from '@/lib/spaces/colors';

describe('space colors', () => {
  it('converts hexadecimal colors to HSL channels', () => {
    const color = hexToHsl('#1F2A65');
    expect(color.hue).toBeCloseTo(230.57, 2);
    expect(color.saturation).toBeCloseTo(53.03, 2);
    expect(color.lightness).toBeCloseTo(25.88, 2);
  });

  it('converts HSL channels to uppercase hexadecimal', () => {
    expect(hslToHex(hexToHsl('#1F2A65'))).toBe('#1F2A65');
    expect(hslToHex({ hue: 0, saturation: 100, lightness: 50 }))
      .toBe('#FF0000');
  });

  it('normalizes text input while preserving the hash prefix', () => {
    expect(normalizeSpaceHexInput('1f2a65')).toBe('#1F2A65');
    expect(normalizeSpaceHexInput('#1f-2a-65-extra')).toBe('#1F2A65');
  });

  it('falls back to the default color for invalid stored values', () => {
    expect(hexToHsl('invalid')).toEqual(hexToHsl(DEFAULT_SPACE_COLOR));
  });

  it('applies a clamped alpha channel to hexadecimal colors', () => {
    expect(getSpaceColorWithAlpha('#1F2A65', 0.75))
      .toBe('rgba(31, 42, 101, 0.75)');
    expect(getSpaceColorWithAlpha('#1F2A65', 2))
      .toBe('rgba(31, 42, 101, 1)');
  });
});
