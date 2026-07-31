'use client';

import type { CSSProperties } from 'react';
import { themeColors } from '@/lib/theme-colors';
import styles from './RangeSlider.module.css';

export interface RangeSliderProps {
  accentHandle?: boolean;
  ariaLabel: string;
  className?: string;
  disabled?: boolean;
  gradient?: string;
  max: number;
  min: number;
  onChange: (value: number) => void;
  step?: number;
  value: number;
}

export default function RangeSlider({
  accentHandle = false,
  ariaLabel,
  className = '',
  disabled = false,
  gradient,
  max,
  min,
  onChange,
  step = 1,
  value,
}: RangeSliderProps) {
  const progress = max === min ? 0 : (value - min) / (max - min) * 100;
  const track = gradient ?? [
    'linear-gradient(to right,',
    'var(--color-range-accent) 0%,',
    `var(--color-range-accent) ${progress}%,`,
    `var(--color-range-neutral) ${progress}%,`,
    'var(--color-range-neutral) 100%)',
  ].join(' ');

  return (
    <input
      aria-label={ariaLabel}
      className={`${styles.range} ${
        accentHandle ? styles.accentHandle : ''
      } ${themeColors.form.colorRange} ${className}`}
      disabled={disabled}
      max={max}
      min={min}
      step={step}
      style={{ '--color-range-gradient': track } as CSSProperties}
      type="range"
      value={value}
      onChange={(event) => onChange(Number(event.target.value))}
    />
  );
}
