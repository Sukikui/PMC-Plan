import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import Discord from "next-auth/providers/discord"
import { prisma } from "@/lib/prisma"
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
      // On first sign-in, enrich the token with Discord profile info
      if (account?.provider === 'discord' && profile) {
        const p = profile as DiscordProfile;
        if (user) {
          await prisma.user.update({
            where: { id: user.id },
            data: { username: p.username },
          });
        }
        token.username = p.username ?? token.username;
        token.globalName = p.global_name ?? p.name ?? token.globalName;
        // NextAuth sets token.picture from user.image; keep ours if provided
        if (user?.image) token.picture = user.image;
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = (token as JWT).role
        session.user.id = token.id as string
        // Surface Discord fields on session
        if (token.username) session.user.username = token.username
        if (token.globalName) session.user.globalName = token.globalName
        if (token.picture && !session.user.image) session.user.image = token.picture
      }
      return session
    }
  }
})
