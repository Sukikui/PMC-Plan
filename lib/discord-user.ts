import type { Prisma } from '@prisma/client';
import { getInitialUserRole } from '@/lib/admin/application-settings-service';
import { prisma } from '@/lib/prisma';
import type { DiscordProfile } from '@/types/discord-profile';

export const discordIdentitySelect = {
  id: true,
  discordUsername: true,
  discordDisplayName: true,
  discordAvatarUrl: true,
} satisfies Prisma.UserSelect;

export type StoredDiscordIdentity = Prisma.UserGetPayload<{
  select: typeof discordIdentitySelect;
}>;

const getDiscordImage = (profile: DiscordProfile) => {
  if (profile.id && profile.avatar) {
    const format = profile.avatar.startsWith('a_') ? 'gif' : 'png';
    return `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.${format}`;
  }

  return null;
};

export const toPublicDiscordIdentity = (user: StoredDiscordIdentity) => ({
  id: user.id,
  name: user.discordDisplayName ?? user.discordUsername,
  username: user.discordUsername,
  image: user.discordAvatarUrl,
});

export async function syncDiscordUser(
  profile: DiscordProfile,
  providerImage?: string | null,
) {
  const discordUsername = profile.username.trim();
  if (!profile.id || !discordUsername) {
    throw new Error('Discord returned an incomplete identity.');
  }

  const identity = {
    discordUsername,
    discordDisplayName: profile.global_name?.trim() || null,
    discordAvatarUrl: getDiscordImage(profile) ?? providerImage ?? null,
  };
  const initialRole = await getInitialUserRole();

  return prisma.user.upsert({
    where: { discordId: profile.id },
    create: {
      discordId: profile.id,
      ...identity,
      role: initialRole,
    },
    update: identity,
    select: { ...discordIdentitySelect, role: true },
  });
}
