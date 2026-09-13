'use client';

import { useEffect, useState } from 'react';
import { getColorForeground } from '@/lib/content/colors';
import {
  DEFAULT_SPACE_LOGO_BACKGROUND,
  DEFAULT_SPACE_LOGO_ZOOM,
  SPACE_LOGO_IMAGE_SCALE,
  clampSpaceLogoZoom,
  getSpaceInitial,
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
  const zoom = clampSpaceLogoZoom(logoZoom);

  return (
    <div
      aria-label={hasImage ? undefined : `Initiale de ${name}`}
      className={`${sizeClass} flex shrink-0 items-center justify-center overflow-hidden font-semibold ${themeColors.util.roundedFull}`}
      style={{
        backgroundColor: hasImage && logoBackground === 'transparent'
          ? 'transparent'
          : color,
        color: getColorForeground(color),
      }}
    >
      {hasImage ? (
        <img
          alt={`Logo de ${name}`}
          className="object-contain transition-transform duration-200"
          referrerPolicy="no-referrer"
          src={logoUrl ?? undefined}
          style={{
            height: `${SPACE_LOGO_IMAGE_SCALE * 100}%`,
            width: `${SPACE_LOGO_IMAGE_SCALE * 100}%`,
            transform: `scale(${zoom})`,
          }}
          onError={() => setImageFailed(true)}
        />
      ) : getSpaceInitial(name)}
    </div>
  );
}
