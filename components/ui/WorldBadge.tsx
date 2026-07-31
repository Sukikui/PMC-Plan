import { themeColors } from '@/lib/theme-colors';

interface WorldBadgeProps {
  size?: 'small' | 'large';
  world: string;
}

const sizeClasses = {
  small: 'px-2 py-1 text-xs',
  large: 'px-3 py-1 text-sm',
} as const;

export default function WorldBadge({
  size = 'small',
  world,
}: WorldBadgeProps) {
  const tone = world === 'overworld' || world === 'nether'
    ? themeColors.world[world]
    : themeColors.world.unknown;

  return (
    <span
      className={`inline-block font-medium ${themeColors.util.roundedFull} ${themeColors.transition} ${sizeClasses[size]} ${tone}`}
    >
      {world}
    </span>
  );
}
