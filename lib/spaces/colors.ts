export const DEFAULT_SPACE_COLOR = '#3B82F6';

export interface HslColor {
  hue: number;
  saturation: number;
  lightness: number;
}

export function hexToHsl(color: string): HslColor {
  const { red, green, blue } = parseHexChannels(color);
  const channels = [red, green, blue].map((channel) => channel / 255);
  const maximum = Math.max(...channels);
  const minimum = Math.min(...channels);
  const delta = maximum - minimum;
  const lightness = (maximum + minimum) / 2;

  if (delta === 0) {
    return { hue: 0, saturation: 0, lightness: lightness * 100 };
  }

  const [normalizedRed, normalizedGreen, normalizedBlue] = channels;
  let hue = 0;
  if (maximum === normalizedRed) {
    hue = 60 * (((normalizedGreen - normalizedBlue) / delta) % 6);
  } else if (maximum === normalizedGreen) {
    hue = 60 * ((normalizedBlue - normalizedRed) / delta + 2);
  } else {
    hue = 60 * ((normalizedRed - normalizedGreen) / delta + 4);
  }

  return {
    hue: hue < 0 ? hue + 360 : hue,
    saturation: delta / (1 - Math.abs(2 * lightness - 1)) * 100,
    lightness: lightness * 100,
  };
}

export function hslToHex({ hue, saturation, lightness }: HslColor) {
  const normalizedHue = ((hue % 360) + 360) % 360;
  const normalizedSaturation = clampPercentage(saturation) / 100;
  const normalizedLightness = clampPercentage(lightness) / 100;
  const chroma = (
    1 - Math.abs(2 * normalizedLightness - 1)
  ) * normalizedSaturation;
  const section = normalizedHue / 60;
  const secondary = chroma * (1 - Math.abs(section % 2 - 1));
  const [red, green, blue] = getRgbSection(section, chroma, secondary);
  const offset = normalizedLightness - chroma / 2;

  return `#${[red, green, blue]
    .map((channel) => Math.round((channel + offset) * 255)
      .toString(16)
      .padStart(2, '0'))
    .join('')
    .toUpperCase()}`;
}

export function normalizeSpaceHexInput(input: string) {
  const digits = input
    .replace(/#/g, '')
    .replace(/[^0-9A-F]/gi, '')
    .slice(0, 6)
    .toUpperCase();
  return `#${digits}`;
}

export function getSpaceForeground(color: string) {
  const { red, green, blue } = parseHexChannels(color);
  const luminance = (red * 299 + green * 587 + blue * 114) / 1000;
  return luminance >= 150 ? '#111827' : '#FFFFFF';
}

export function getSpaceColorWithAlpha(color: string, alpha: number) {
  const { red, green, blue } = parseHexChannels(color);
  const normalizedAlpha = Math.min(1, Math.max(0, alpha));
  return `rgba(${red}, ${green}, ${blue}, ${normalizedAlpha})`;
}

function parseHexChannels(color: string) {
  const source = /^#[0-9A-F]{6}$/i.test(color)
    ? color
    : DEFAULT_SPACE_COLOR;
  return {
    red: Number.parseInt(source.slice(1, 3), 16),
    green: Number.parseInt(source.slice(3, 5), 16),
    blue: Number.parseInt(source.slice(5, 7), 16),
  };
}

function clampPercentage(value: number) {
  return Math.min(100, Math.max(0, value));
}

function getRgbSection(
  section: number,
  chroma: number,
  secondary: number,
): [number, number, number] {
  if (section < 1) return [chroma, secondary, 0];
  if (section < 2) return [secondary, chroma, 0];
  if (section < 3) return [0, chroma, secondary];
  if (section < 4) return [0, secondary, chroma];
  if (section < 5) return [secondary, 0, chroma];
  return [chroma, 0, secondary];
}
