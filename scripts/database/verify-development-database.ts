import { assertLocalDatabaseEnvironment } from './environment.mjs';

assertLocalDatabaseEnvironment();

const discordId = process.env.DEV_DISCORD_ID?.trim();
if (!discordId) throw new Error('DEV_DISCORD_ID is missing.');

const { prisma } = await import('../../lib/prisma');

try {
  const [developer, migrations, linkRequests] = await Promise.all([
    prisma.user.findUnique({ where: { discordId } }),
    prisma.$queryRaw<Array<{ count: number }>>`
      SELECT COUNT(*)::int AS count FROM "_prisma_migrations"
    `,
    prisma.minecraftLinkRequest.count(),
  ]);

  if (developer?.role !== 'super_admin') {
    throw new Error('The local developer account is not a Super Admin.');
  }
  if (!migrations[0]?.count) {
    throw new Error('The local database migration history is missing.');
  }
  if (linkRequests !== 0) {
    throw new Error('Temporary MineVerify requests were not cleared.');
  }
} finally {
  await prisma.$disconnect();
}
