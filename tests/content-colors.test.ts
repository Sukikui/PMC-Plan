import {
  DEFAULT_CONTENT_COLOR,
  contentColorSchema,
  getColorWithAlpha,
  hexToHsl,
  hslToHex,
  normalizeHexColorInput,
  resolveContentColor,
} from '@/lib/content/colors';

describe('content colors', () => {
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

  it('normalizes and validates hexadecimal input', () => {
    expect(normalizeHexColorInput('1f2a65')).toBe('#1F2A65');
    expect(normalizeHexColorInput('#1f-2a-65-extra')).toBe('#1F2A65');
    expect(contentColorSchema.parse('#1f2a65')).toBe('#1F2A65');
    expect(contentColorSchema.safeParse('#123').success).toBe(false);
  });

  it('falls back to the default color for invalid stored values', () => {
    expect(hexToHsl('invalid')).toEqual(hexToHsl(DEFAULT_CONTENT_COLOR));
  });

  it('applies a clamped alpha channel to hexadecimal colors', () => {
    expect(getColorWithAlpha('#1F2A65', 0.75))
      .toBe('rgba(31, 42, 101, 0.75)');
    expect(getColorWithAlpha('#1F2A65', 2))
      .toBe('rgba(31, 42, 101, 1)');
  });

  it('gives the associated space priority over the content color', () => {
    expect(resolveContentColor({
      color: '#3B82F6',
      space: { color: '#1F2A65' },
    })).toBe('#1F2A65');
    expect(resolveContentColor({ color: '#3B82F6', space: null }))
      .toBe('#3B82F6');
  });
});
