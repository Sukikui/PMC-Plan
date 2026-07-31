const MC_HEADS_BASE_URL = 'https://api.mcheads.org';
const MC_HEAD_DIRECTION = 'right';
const DEFAULT_MINECRAFT_HEAD_URL = '/assets/minecraft/default-player-head.png';
const MIN_HEAD_SIZE = 16;
const MAX_HEAD_SIZE = 512;
const DEFAULT_HEAD_SIZE = 256;
const DEFAULT_BODY_SIZE = 512;

export const DEFAULT_MINECRAFT_HEAD_PLAYER = 'MHF_steve';

export function getMinecraftHeadUrl(
  playerIdentifier: string,
  size = DEFAULT_HEAD_SIZE,
): string {
  const normalizedIdentifier = playerIdentifier.trim();
  if (
    !normalizedIdentifier
    || normalizedIdentifier.toLowerCase() === DEFAULT_MINECRAFT_HEAD_PLAYER.toLowerCase()
  ) {
    return getDefaultMinecraftHeadUrl();
  }
  const normalizedSize = Math.min(
    MAX_HEAD_SIZE,
    Math.max(MIN_HEAD_SIZE, Math.round(size)),
  );
  return buildMinecraftRenderUrl('ioshead', normalizedIdentifier, normalizedSize);
}

export function getMinecraftBodyUrl(
  playerIdentifier: string,
  size = DEFAULT_BODY_SIZE,
): string {
  const normalizedIdentifier = playerIdentifier.trim()
    || DEFAULT_MINECRAFT_HEAD_PLAYER;
  const normalizedSize = Math.min(
    MAX_HEAD_SIZE,
    Math.max(MIN_HEAD_SIZE, Math.round(size)),
  );
  return buildMinecraftRenderUrl('iosbody', normalizedIdentifier, normalizedSize);
}

export function getDefaultMinecraftHeadUrl(): string {
  return DEFAULT_MINECRAFT_HEAD_URL;
}

export function getMinecraftHeadSources(
  ...playerIdentifiers: Array<string | null | undefined>
): string[] {
  const remoteSources = playerIdentifiers
    .map((identifier) => getMinecraftHeadUrl(identifier ?? ''))
    .filter((source) => source !== DEFAULT_MINECRAFT_HEAD_URL);

  return Array.from(new Set([...remoteSources, DEFAULT_MINECRAFT_HEAD_URL]));
}

function buildMinecraftRenderUrl(
  render: 'iosbody' | 'ioshead',
  playerIdentifier: string,
  size: number,
) {
  return `${MC_HEADS_BASE_URL}/${render}/${encodeURIComponent(playerIdentifier)}/${MC_HEAD_DIRECTION}/${size}`;
}
