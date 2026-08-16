import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@/generated/prisma/client';
import { createPrismaPgConfig } from '@/lib/prisma/connection';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const testConnectionString = process.env.NODE_ENV === 'test'
  ? 'postgresql://unconfigured:unconfigured@127.0.0.1:1/unconfigured'
  : undefined;
const adapter = new PrismaPg(createPrismaPgConfig(
  process.env.DATABASE_URL ?? testConnectionString,
));

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
