'use client';

import {
  useEffect,
  useState,
  type ImgHTMLAttributes,
  type SyntheticEvent,
} from 'react';
import {
  getMinecraftHeadSources,
} from '@/lib/minecraft-head-service';
import { themeColors } from '@/lib/theme-colors';

interface MinecraftHeadImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  fallbackPlayerIdentifier?: string | null;
  playerIdentifier?: string | null;
}

export default function MinecraftHeadImage({
  fallbackPlayerIdentifier,
  playerIdentifier,
  className = '',
  onError,
  ...imageProps
}: MinecraftHeadImageProps) {
  const [sourceIndex, setSourceIndex] = useState(0);
  const sources = getMinecraftHeadSources(
    playerIdentifier,
    fallbackPlayerIdentifier,
  );

  useEffect(() => {
    setSourceIndex(0);
  }, [fallbackPlayerIdentifier, playerIdentifier]);

  const handleError = (event: SyntheticEvent<HTMLImageElement>) => {
    if (sourceIndex < sources.length - 1) {
      setSourceIndex((currentIndex) => currentIndex + 1);
      return;
    }
    onError?.(event);
  };

  return (
    <img
      {...imageProps}
      src={sources[sourceIndex] ?? sources.at(-1)}
      className={`${className} ${themeColors.util.roundedSm}`}
      onError={handleError}
    />
  );
}
