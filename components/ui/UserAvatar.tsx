'use client';

import React, { useEffect, useState } from 'react';
import { themeColors } from '@/lib/theme-colors';
import UserIcon from '@/components/icons/UserIcon';

interface UserAvatarProps {
  src?: string | null;
  alt?: string;
  className?: string;
}

export default function UserAvatar({ src, alt = 'Avatar', className = 'w-8 h-8' }: UserAvatarProps) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [src]);

  if (!src || hasError) {
    return (
      <div
        className={`${className} ${themeColors.panel.secondary} border ${themeColors.border.primary} ${themeColors.util.roundedFull} flex items-center justify-center overflow-hidden`}
        aria-label={alt}
      >
        <UserIcon className={`w-[65%] h-[65%] ${themeColors.text.tertiary}`} />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={`${className} ${themeColors.util.roundedFull}`}
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
    />
  );
}
