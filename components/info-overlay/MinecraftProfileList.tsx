'use client';

import MinecraftHeadImage from '@/components/ui/MinecraftHeadImage';
import type { MinecraftOwner } from '@/lib/map-entry/types';
import { themeColors } from '@/lib/theme-colors';

interface MinecraftProfileListProps {
  pluralTitle: string;
  profiles: MinecraftOwner[];
  singularTitle: string;
}

export default function MinecraftProfileList({
  pluralTitle,
  profiles,
  singularTitle,
}: MinecraftProfileListProps) {
  if (profiles.length === 0) return null;

  return (
    <section>
      <h3 className={`mb-3 text-lg font-semibold ${themeColors.text.primary} ${themeColors.transition}`}>
        {profiles.length > 1 ? pluralTitle : singularTitle}
      </h3>
      <ul className="flex flex-wrap gap-x-5 gap-y-3">
        {profiles.map((profile) => (
          <li key={profile.uuid} className="flex min-w-0 items-center gap-0.5">
            <MinecraftHeadImage
              playerIdentifier={profile.uuid}
              alt={`Tête de ${profile.name}`}
              className="h-12 w-12 shrink-0 object-contain transition-transform duration-200 hover:scale-105"
              crossOrigin="anonymous"
              loading="lazy"
              onError={(event) => {
                event.currentTarget.style.display = 'none';
              }}
            />
            <span className={`max-w-40 truncate px-3 py-1 text-sm font-medium ${themeColors.util.roundedFull} ${themeColors.infoOverlay.placeTags} ${themeColors.transition}`}>
              {profile.name}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
