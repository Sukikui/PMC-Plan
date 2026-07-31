import type { SpaceReference } from '@/lib/spaces/types';

export function resolvePlaceDiscordUrl(
  overrideUrl: string | null,
  space: SpaceReference | null,
) {
  return overrideUrl ?? space?.discordUrl ?? null;
}
