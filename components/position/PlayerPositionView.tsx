'use client';

import { memo, useEffect, useState } from 'react';
import MinecraftHeadImage from '@/components/ui/MinecraftHeadImage';
import { getMinecraftBodyUrl } from '@/lib/minecraft-head-service';
import { themeColors } from '@/lib/theme-colors';
import { panelBottomFadeStyle } from '@/lib/ui/panel';

function PlayerPositionView({
  username,
  transitionDuration,
  visible,
}: {
  username: string;
  transitionDuration: number;
  visible: boolean;
}) {
  const [bodyUnavailable, setBodyUnavailable] = useState(false);

  useEffect(() => {
    setBodyUnavailable(false);
  }, [username]);

  return (
    <div
      className={`relative hidden min-w-0 flex-1 overflow-hidden border-l sm:block ${themeColors.border.primary}`}
    >
      <div
        className={`absolute inset-0 origin-center transition-[opacity,transform] ease-out ${
          visible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
        style={{
          backfaceVisibility: 'hidden',
          transitionDuration: `${transitionDuration}ms`,
          willChange: 'opacity, transform',
        }}
      >
        {bodyUnavailable ? (
          <div
            className={`absolute left-1/2 top-12 h-24 w-24 -translate-x-1/2 ${themeColors.positionPanel.playerSkinGlow}`}
          >
            <MinecraftHeadImage
              playerIdentifier={username}
              alt={`Tête de ${username}`}
              className="h-full w-full object-cover"
              loading="eager"
              style={panelBottomFadeStyle}
            />
          </div>
        ) : (
          <div
            className={`absolute left-1/2 top-4 h-[88%] aspect-[1/2] -translate-x-1/2 ${themeColors.positionPanel.playerSkinGlow}`}
          >
            <img
              src={getMinecraftBodyUrl(username)}
              alt={`Personnage Minecraft de ${username}`}
              className="h-full w-full object-contain"
              crossOrigin="anonymous"
              decoding="async"
              draggable={false}
              loading="eager"
              onError={() => setBodyUnavailable(true)}
              style={panelBottomFadeStyle}
            />
          </div>
        )}
        <span
          className={`absolute bottom-4 left-1/2 max-w-[calc(100%-1.5rem)] -translate-x-1/2 truncate border px-3 py-1 text-xs font-medium ${themeColors.panel.tertiary} ${themeColors.blurSm} ${themeColors.border.primary} ${themeColors.text.primary} ${themeColors.util.roundedFull}`}
        >
          {username}
        </span>
      </div>
    </div>
  );
}

export default memo(PlayerPositionView);
