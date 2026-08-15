import { assertLocalDatabaseEnvironment } from './environment.mjs';

assertLocalDatabaseEnvironment();

const discordId = process.env.DEV_DISCORD_ID?.trim();
if (!discordId || !/^\d{17,20}$/.test(discordId)) {
  throw new Error('DEV_DISCORD_ID must contain the Discord user ID used locally.');
}

const { prisma } = await import('../../lib/prisma');

try {
  await prisma.minecraftLinkRequest.deleteMany();
  const existing = await prisma.user.findUnique({ where: { discordId } });

  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: { role: 'super_admin' },
    });
  } else {
    await prisma.user.create({
      data: {
        id: `development-${discordId}`,
        discordId,
        discordUsername: 'local_developer',
        discordDisplayName: 'Local Developer',
        role: 'super_admin',
      },
    });
  }
} finally {
  await prisma.$disconnect();
}
