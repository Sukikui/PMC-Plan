import { getRenderUrl } from '@/lib/starlight-skin-api';
import { themeColors } from '@/lib/theme-colors';
import type { PlayerData } from '@/lib/playercoords-api';

export default function PlayerPositionView({
  isNewConnection,
  playerData,
}: {
  isNewConnection: boolean;
  playerData: PlayerData;
}) {
  const glowAnimationName = typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
    ? 'blueGlowDark'
    : 'blueGlow';

  return (
    <>
      <div
        className={`${themeColors.panel.primary} ${themeColors.blurSm} ${themeColors.util.roundedLg} p-3 border ${themeColors.border.primary} ${isNewConnection ? '' : themeColors.transition}`}
        style={{
          animation: isNewConnection ? 'blueGlow 0.5s ease-out' : undefined,
          animationName: isNewConnection ? glowAnimationName : undefined,
        }}
      >
        <div className="flex items-center gap-6">
          <div className="relative w-16 h-16 overflow-hidden ml-2">
            <img
              src={getRenderUrl(playerData.username, {
                renderType: 'ultimate',
                crop: 'face',
                borderHighlight: true,
                borderHighlightRadius: 7,
                dropShadow: true,
              })}
              alt={`Skin de ${playerData.username}`}
              className="w-full h-full object-cover"
              style={{ imageRendering: 'pixelated' }}
              crossOrigin="anonymous"
              loading="eager"
            />
            <div className="absolute inset-x-0 bottom-0 h-3 bg-gradient-to-t from-white/90 to-transparent dark:from-gray-900/95 dark:to-transparent pointer-events-none" />
          </div>
          <div>
            <div className={`text-sm font-medium ${themeColors.text.primary} ${themeColors.transition}`}>{playerData.username}</div>
            <div className={`text-xs ${themeColors.text.tertiary} mt-1.5 ${themeColors.transition}`}>UUID: {playerData.uuid.substring(0, 8)}...</div>
          </div>
        </div>
      </div>

      <WorldBadges world={playerData.world} />
      <CoordinatesDisplay x={playerData.x} y={playerData.y} z={playerData.z} />
    </>
  );
}

function WorldBadges({ world }: { world: string }) {
  return (
    <div className="flex gap-1">
      <button className={`px-2 py-1 text-xs ${themeColors.util.roundedFull} font-medium ${themeColors.transition} ${
        (world === 'overworld' || world === 'minecraft:overworld') ? themeColors.world.overworld : themeColors.button.ghost
      }`} disabled>
        overworld
      </button>
      <button className={`px-2 py-1 text-xs ${themeColors.util.roundedFull} font-medium ${themeColors.transition} ${
        (world === 'nether' || world === 'minecraft:the_nether') ? themeColors.world.nether : themeColors.button.ghost
      }`} disabled>
        nether
      </button>
    </div>
  );
}

function CoordinatesDisplay({ x, y, z }: { x: number; y: number; z: number }) {
  return (
    <div className="flex items-center gap-3">
      <CoordinateValue axis="X" value={Math.floor(x)} />
      <CoordinateValue axis="Y" value={Math.floor(y)} />
      <CoordinateValue axis="Z" value={Math.floor(z)} trailing />
    </div>
  );
}

function CoordinateValue({ axis, value, trailing = false }: { axis: string; value: number; trailing?: boolean }) {
  return (
    <>
      <label className={`text-xs font-medium ${themeColors.text.quaternary} w-4 text-center ${themeColors.transition}`}>{axis}</label>
      <div className={`w-16 px-2 py-1 text-xs ${themeColors.text.primary} ${themeColors.input.base} border rounded ${trailing ? 'mr-3' : ''} ${themeColors.transition}`}>
        {value}
      </div>
    </>
  );
}
