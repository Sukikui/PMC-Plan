import type { DiscordProfile } from '@/types/discord-profile';

export const getDiscordDisplayName = (profile: DiscordProfile) =>
  profile.global_name?.trim() || profile.username?.trim() || profile.name?.trim() || null;

export const getDiscordImage = (profile: DiscordProfile) => {
  if (profile.image_url?.trim()) {
    return profile.image_url.trim();
  }

  if (profile.id && profile.avatar) {
    const format = profile.avatar.startsWith('a_') ? 'gif' : 'png';
    return `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.${format}`;
  }

  return null;
};
