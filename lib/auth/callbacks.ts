import type { NextAuthConfig } from 'next-auth';
import type { JWT } from 'next-auth/jwt';
import {
  syncDiscordUser,
  toPublicDiscordIdentity,
} from '@/lib/discord-user';
import { prisma } from '@/lib/prisma';
import type { DiscordProfile } from '@/types/discord-profile';

export const authCallbacks = {
  async jwt({ token, user, account, profile }) {
    if (account?.provider === 'discord' && profile) {
      const storedUser = await syncDiscordUser(
        toDiscordProfile(profile),
        user?.image,
      );
      const identity = toPublicDiscordIdentity(storedUser);
      token.id = storedUser.id;
      token.role = storedUser.role;
      token.username = identity.username;
      token.globalName = identity.name;
      token.name = identity.name;
      token.picture = identity.image ?? undefined;
    } else if (token.id) {
      const currentUser = await prisma.user.findUnique({
        where: { id: token.id },
        select: { role: true },
      });
      token.role = currentUser?.role ?? 'pending';
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

function toDiscordProfile(profile: Record<string, unknown>): DiscordProfile {
  if (typeof profile.id !== 'string' || typeof profile.username !== 'string') {
    throw new Error('Discord returned an incomplete identity.');
  }

  return {
    id: profile.id,
    username: profile.username,
    global_name: typeof profile.global_name === 'string'
      ? profile.global_name
      : null,
    avatar: typeof profile.avatar === 'string' ? profile.avatar : null,
  };
}
