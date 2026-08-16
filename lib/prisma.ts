import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@/generated/prisma/client';
import { createPrismaPgConfig } from '@/lib/prisma/connection';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Next.js imports route modules while building, including in CI without database secrets.
const connectionString = process.env.DATABASE_URL
  ?? 'postgresql://unconfigured:unconfigured@127.0.0.1:1/unconfigured';
const adapter = new PrismaPg(createPrismaPgConfig(connectionString));

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
