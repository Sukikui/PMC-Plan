'use client';

import { useEffect, useState } from 'react';
import { themeColors } from '@/lib/theme-colors';
import UserIcon from '@/components/icons/UserIcon';

interface UserAvatarProps {
  src?: string | null;
  alt?: string;
  className?: string;
  fallbackSrc?: string | null;
  shape?: 'circle' | 'rounded';
}

export default function UserAvatar({
  src,
  alt = 'Avatar',
  className = 'w-8 h-8',
  fallbackSrc,
  shape = 'circle',
}: UserAvatarProps) {
  const [hasError, setHasError] = useState(false);
  const [usingFallback, setUsingFallback] = useState(false);
  const radiusClass = shape === 'circle'
    ? themeColors.util.roundedFull
    : themeColors.util.roundedSm;

  useEffect(() => {
    setHasError(false);
    setUsingFallback(false);
  }, [fallbackSrc, src]);

  const imageSrc = usingFallback ? fallbackSrc : (src ?? fallbackSrc);

  if (!imageSrc || hasError) {
    return (
      <div
        className={`${className} ${themeColors.panel.secondary} border ${themeColors.border.primary} ${radiusClass} flex items-center justify-center overflow-hidden`}
        aria-label={alt}
      >
        <UserIcon className={`w-[65%] h-[65%] ${themeColors.text.tertiary}`} />
      </div>
    );
  }

  return (
    <img
      src={imageSrc}
      alt={alt}
      className={`${className} ${radiusClass}`}
      referrerPolicy="no-referrer"
      onError={() => {
        if (!usingFallback && src && fallbackSrc && src !== fallbackSrc) {
          setUsingFallback(true);
          return;
        }
        setHasError(true);
      }}
    />
  );
}
