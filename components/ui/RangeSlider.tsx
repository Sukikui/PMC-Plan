'use client';

import type { CSSProperties } from 'react';
import { themeColors } from '@/lib/theme-colors';
import styles from './RangeSlider.module.css';

export interface RangeSliderProps {
  accentHandle?: boolean;
  ariaLabel: string;
  valueText?: string;
  markers?: readonly string[];
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
  valueText,
  markers,
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
  const selectedMarkerIndex = markers ? Math.round(progress / 100 * (markers.length - 1)) : -1;
  const track = gradient ?? [
    'linear-gradient(to right,',
    'var(--color-range-accent) 0%,',
    `var(--color-range-accent) ${progress}%,`,
    `var(--color-range-neutral) ${progress}%,`,
    'var(--color-range-neutral) 100%)',
  ].join(' ');

  const input = (
    <input
      aria-label={ariaLabel}
      aria-valuetext={valueText}
      title={valueText}
      className={`${styles.range} ${markers ? styles.discrete : ''} ${
        accentHandle ? styles.accentHandle : ''
      } ${themeColors.form.colorRange} ${markers ? 'w-full' : className}`}
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
  if (!markers) return input;
  return (
    <div className={`${styles.discreteContainer} ${themeColors.form.colorRange} ${themeColors.text.secondary} ${className}`}>
      <div className={styles.markers} aria-hidden="true" style={{ '--range-progress': `${progress}%` } as CSSProperties}>
        {markers.map((label, index) => (
          <span key={label} className={styles.marker} data-active={index <= selectedMarkerIndex} />
        ))}
      </div>
      {input}
      <div className={`${styles.markerLabels} text-xs ${themeColors.text.secondary}`} aria-hidden="true">
        {markers.map((label, index) => (
          <span key={label} style={{ left: `${index * 100 / Math.max(1, markers.length - 1)}%`, width: `${100 / markers.length}%` }}>{label}</span>
        ))}
      </div>
    </div>
  );
}
