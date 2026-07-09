import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import Discord from "next-auth/providers/discord"
import { prisma } from "@/lib/prisma"
import { getDiscordDisplayName, getDiscordImage } from "@/lib/discord-user"
import type { User } from "@prisma/client"
import type { JWT } from "next-auth/jwt"
import type { DiscordProfile } from "@/types/discord-profile"

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  // WARNING: `trustHost` should be used with caution in production environments.
  // It can have security implications if not properly configured (e.g., if NEXTAUTH_URL is not set correctly
  // or if the application is behind a reverse proxy that doesn't correctly set X-Forwarded-Host).
  trustHost: true,
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  pages: { signIn: "/" },
  providers: [
    Discord({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
    })
  ],
  callbacks: {
    async jwt({ token, user, account, profile }) {
      if (user) {
        token.role = (user as User).role
        token.id = user.id as string
      }

      if (account?.provider === 'discord' && profile) {
        const p = profile as DiscordProfile;
        const currentUser = user as User | undefined;
        const discordDisplayName = getDiscordDisplayName(p);
        const discordImage = getDiscordImage(p);

        if (user) {
          const updates: {
            username?: string;
            name?: string | null;
            image?: string | null;
          } = {};

          if (p.username && p.username !== currentUser?.username) {
            updates.username = p.username;
          }

          if (discordDisplayName && discordDisplayName !== currentUser?.name) {
            updates.name = discordDisplayName;
          }

          if (discordImage !== (currentUser?.image ?? null)) {
            updates.image = discordImage;
          }

          if (Object.keys(updates).length > 0) {
            await prisma.user.update({
              where: { id: user.id },
              data: updates,
            });
          }
        }

        token.username = p.username ?? token.username;
        token.globalName = discordDisplayName ?? token.globalName;
        token.name = discordDisplayName ?? token.name;

        if (discordImage) {
          token.picture = discordImage;
        }
      }

      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = (token as JWT).role
        session.user.id = token.id as string
        if (token.username) session.user.username = token.username
        if (token.globalName) session.user.globalName = token.globalName
        if (typeof token.picture === "string") session.user.image = token.picture
      }
      return session
    }
  }
})
