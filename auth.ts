import { PrismaAdapter } from '@auth/prisma-adapter';
import NextAuth from 'next-auth';
import Discord from 'next-auth/providers/discord';
import { applyApprovalPolicyToCreatedUser } from '@/lib/admin/application-settings-service';
import { authCallbacks } from '@/lib/auth/callbacks';
import { prisma } from '@/lib/prisma';

const prismaAdapter = PrismaAdapter(prisma);
const createPrismaUser = prismaAdapter.createUser!;

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: {
    ...prismaAdapter,
    createUser: async (user) => applyApprovalPolicyToCreatedUser(
      await createPrismaUser(user),
    ),
  },
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
    }),
  ],
  callbacks: authCallbacks,
});
