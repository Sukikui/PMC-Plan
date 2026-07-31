'use client';

import { useEffect, useState } from 'react';
import {
  hexToHsl,
  hslToHex,
  normalizeSpaceHexInput,
  type HslColor,
} from '@/lib/spaces/colors';
import { themeColors } from '@/lib/theme-colors';
import { formInputClassName } from '@/components/form/common/form-styles';
import SpaceRangeField, {
  spaceRangeSectionClassName,
} from './SpaceRangeField';

interface SpaceColorPickerProps {
  disabled?: boolean;
  onChange: (color: string) => void;
  value: string;
}

export default function SpaceColorPicker({
  disabled = false,
  onChange,
  value,
}: SpaceColorPickerProps) {
  const [hexInput, setHexInput] = useState(value);
  const [hsl, setHsl] = useState(() => hexToHsl(value));

  useEffect(() => {
    setHexInput(value);
    setHsl((current) => (
      hslToHex(current) === value.toUpperCase()
        ? current
        : hexToHsl(value)
    ));
  }, [value]);

  const updateChannel = (channel: keyof HslColor, nextValue: number) => {
    const nextHsl = { ...hsl, [channel]: nextValue };
    setHsl(nextHsl);
    onChange(hslToHex(nextHsl));
  };

  const updateHex = (rawValue: string) => {
    const normalized = normalizeSpaceHexInput(rawValue);
    setHexInput(normalized);
    if (/^#[0-9A-F]{6}$/.test(normalized)) {
      setHsl(hexToHsl(normalized));
      onChange(normalized);
    }
  };

  return (
    <fieldset aria-label="Couleur de l’espace" disabled={disabled}>
      <div className={spaceRangeSectionClassName}>
        <div className="space-y-3">
          {CHANNELS.map(({ key, label, maximum }) => (
            <SpaceRangeField
              key={key}
              disabled={disabled}
              gradient={getChannelGradient(key, hsl.hue)}
              label={label}
              max={maximum}
              min={0}
              value={hsl[key]}
              onChange={(nextValue) => updateChannel(key, nextValue)}
            />
          ))}
        </div>

        <label className="space-y-2">
          <span className={`block text-xs font-medium ${themeColors.text.secondary}`}>
            Hexadécimal
          </span>
          <div className="relative">
            <span
              aria-hidden="true"
              className={`pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 border ${themeColors.util.roundedSm} ${themeColors.border.tertiary}`}
              style={{ backgroundColor: value }}
            />
            <input
              aria-label="Couleur hexadécimale"
              autoCapitalize="characters"
              autoComplete="off"
              className={`${formInputClassName} !pl-11 font-mono uppercase`}
              inputMode="text"
              maxLength={7}
              spellCheck={false}
              value={hexInput}
              onBlur={() => setHexInput(value)}
              onChange={(event) => updateHex(event.target.value)}
            />
          </div>
        </label>
      </div>
    </fieldset>
  );
}

const CHANNELS: Array<{
  key: keyof HslColor;
  label: string;
  maximum: number;
}> = [
  { key: 'hue', label: 'Teinte', maximum: 360 },
  { key: 'saturation', label: 'Saturation', maximum: 100 },
  { key: 'lightness', label: 'Luminosité', maximum: 100 },
];

function getChannelGradient(channel: keyof HslColor, hue: number) {
  const roundedHue = Math.round(hue);
  if (channel === 'hue') {
    return 'linear-gradient(to right, #FF0000, #FFFF00, #00FF00, #00FFFF, #0000FF, #FF00FF, #FF0000)';
  }
  if (channel === 'saturation') {
    return `linear-gradient(to right, hsl(${roundedHue} 0% 50%), hsl(${roundedHue} 100% 50%))`;
  }
  return `linear-gradient(to right, #000000, hsl(${roundedHue} 100% 50%), #FFFFFF)`;
}
