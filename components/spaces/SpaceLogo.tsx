'use client';

import { useEffect, useState } from 'react';
import { getSpaceForeground } from '@/lib/spaces/colors';
import {
  DEFAULT_SPACE_LOGO_BACKGROUND,
  DEFAULT_SPACE_LOGO_ZOOM,
  MAX_SPACE_LOGO_ZOOM,
  MIN_SPACE_LOGO_ZOOM,
} from '@/lib/spaces/constants';
import type { SpaceLogoBackground } from '@/lib/spaces/types';
import { themeColors } from '@/lib/theme-colors';

interface SpaceLogoProps {
  color: string;
  logoBackground?: SpaceLogoBackground;
  logoUrl?: string | null;
  logoZoom?: number;
  name: string;
  size?: 'tooltip' | 'compact' | 'small' | 'header' | 'medium' | 'overlay' | 'large';
}

const sizeClasses = {
  tooltip: 'h-9 w-9 text-sm',
  compact: 'h-8 w-8 text-sm',
  small: 'h-10 w-10 text-base',
  header: 'h-12 w-12 text-lg',
  medium: 'h-14 w-14 text-xl',
  overlay: 'h-[4.25rem] w-[4.25rem] text-2xl',
  large: 'h-20 w-20 text-3xl',
};

export default function SpaceLogo({
  color,
  logoBackground = DEFAULT_SPACE_LOGO_BACKGROUND,
  logoUrl,
  logoZoom = DEFAULT_SPACE_LOGO_ZOOM,
  name,
  size = 'medium',
}: SpaceLogoProps) {
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [logoUrl]);

  const sizeClass = sizeClasses[size];
  const hasImage = Boolean(logoUrl && !imageFailed);
  const zoom = Math.min(
    MAX_SPACE_LOGO_ZOOM,
    Math.max(MIN_SPACE_LOGO_ZOOM, logoZoom),
  );

  return (
    <div
      aria-label={hasImage ? undefined : `Initiale de ${name}`}
      className={`${sizeClass} flex shrink-0 items-center justify-center overflow-hidden font-semibold ${themeColors.util.roundedFull}`}
      style={{
        backgroundColor: hasImage && logoBackground === 'transparent'
          ? 'transparent'
          : color,
        color: getSpaceForeground(color),
      }}
    >
      {hasImage ? (
        <img
          alt={`Logo de ${name}`}
          className="h-[70.7107%] w-[70.7107%] object-contain transition-transform duration-200"
          referrerPolicy="no-referrer"
          src={logoUrl ?? undefined}
          style={{ transform: `scale(${zoom})` }}
          onError={() => setImageFailed(true)}
        />
      ) : getInitial(name)}
    </div>
  );
}

function getInitial(name: string) {
  return Array.from(name.trim())[0]?.toLocaleUpperCase('fr-FR') ?? '?';
}
