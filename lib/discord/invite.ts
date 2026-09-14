const DISCORD_INVITE_HOSTS = new Set([
  'canary.discord.com',
  'discord.com',
  'discord.gg',
  'discordapp.com',
  'ptb.discord.com',
  'www.discord.com',
  'www.discord.gg',
  'www.discordapp.com',
]);

const INVITE_CODE_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

interface DiscordInvitePayload {
  guild?: {
    icon?: unknown;
    id?: unknown;
    name?: unknown;
  };
}

export interface DiscordServerPreview {
  iconUrl: string | null;
  id: string;
  name: string;
}

export function extractDiscordInviteCode(value: string): string | null {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }

  if (url.protocol !== 'https:' || !DISCORD_INVITE_HOSTS.has(url.hostname)) {
    return null;
  }

  const segments = url.pathname.split('/').filter(Boolean);
  const code = url.hostname.endsWith('discord.gg')
    ? segments[0]
    : segments[0] === 'invite' ? segments[1] : null;

  return code && INVITE_CODE_PATTERN.test(code) ? code : null;
}

export async function resolveDiscordServer(
  inviteUrl: string,
): Promise<DiscordServerPreview | null> {
  const code = extractDiscordInviteCode(inviteUrl);
  if (!code) return null;

  const response = await fetch(
    `https://discord.com/api/v10/invites/${encodeURIComponent(code)}`,
    { next: { revalidate: 21600 } },
  );
  if (!response.ok) return null;

  const payload = await response.json() as DiscordInvitePayload;
  const guild = payload.guild;
  if (
    typeof guild?.id !== 'string'
    || typeof guild.name !== 'string'
    || guild.name.trim() === ''
  ) {
    return null;
  }

  const icon = typeof guild.icon === 'string' ? guild.icon : null;
  return {
    id: guild.id,
    name: guild.name,
    iconUrl: icon
      ? `https://cdn.discordapp.com/icons/${guild.id}/${icon}.webp?size=128`
      : null,
  };
}
