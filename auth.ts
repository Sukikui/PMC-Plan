import NextAuth from 'next-auth';
import Discord from 'next-auth/providers/discord';
import { authCallbacks } from '@/lib/auth/callbacks';

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60,
    updateAge: 24 * 60 * 60,
  },
  pages: { signIn: '/' },
  providers: [
    Discord({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
      authorization: { params: { scope: 'identify' } },
    }),
  ],
  callbacks: authCallbacks,
});
