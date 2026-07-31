import type { User } from '@prisma/client';
import type { NextAuthConfig } from 'next-auth';
import type { JWT } from 'next-auth/jwt';
import { getDiscordDisplayName, getDiscordImage } from '@/lib/discord-user';
import { prisma } from '@/lib/prisma';
import type { DiscordProfile } from '@/types/discord-profile';

export const authCallbacks = {
  async jwt({ token, user, account, profile }) {
    if (user) {
      token.role = (user as User).role;
      token.id = user.id as string;
    } else if (token.id) {
      const currentUser = await prisma.user.findUnique({
        where: { id: token.id },
        select: { role: true },
      });
      token.role = currentUser?.role ?? 'pending';
    }

    if (account?.provider === 'discord' && profile) {
      const discordIdentity = await syncDiscordIdentity(
        user as User | undefined,
        profile as DiscordProfile
      );
      token.username = discordIdentity.username ?? token.username;
      token.globalName = discordIdentity.displayName ?? token.globalName;
      token.name = discordIdentity.displayName ?? token.name;
      if (discordIdentity.image) token.picture = discordIdentity.image;
    }

    return token;
  },
  async session({ session, token }) {
    if (session.user) {
      session.user.role = (token as JWT).role;
      session.user.id = token.id;
      if (token.username) session.user.username = token.username;
      if (token.globalName) session.user.globalName = token.globalName;
      if (typeof token.picture === 'string') session.user.image = token.picture;
    }
    return session;
  },
} satisfies NonNullable<NextAuthConfig['callbacks']>;

async function syncDiscordIdentity(user: User | undefined, profile: DiscordProfile) {
  const displayName = getDiscordDisplayName(profile);
  const image = getDiscordImage(profile);

  if (user) {
    const updates: {
      username?: string;
      name?: string | null;
      image?: string | null;
    } = {};

    if (profile.username && profile.username !== user.username) {
      updates.username = profile.username;
    }
    if (displayName && displayName !== user.name) {
      updates.name = displayName;
    }
    if (image !== (user.image ?? null)) {
      updates.image = image;
    }

    if (Object.keys(updates).length > 0) {
      await prisma.user.update({
        where: { id: user.id },
        data: updates,
      });
    }
  }

  return {
    username: profile.username,
    displayName,
    image,
  };
}
