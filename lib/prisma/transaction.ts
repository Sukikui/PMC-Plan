import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

const TRANSACTION_RETRY_LIMIT = 3;

export async function runSerializableTransaction<T>(
  operation: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  for (let attempt = 1; attempt <= TRANSACTION_RETRY_LIMIT; attempt += 1) {
    try {
      return await prisma.$transaction(operation, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      });
    } catch (error) {
      const canRetry =
        error instanceof Prisma.PrismaClientKnownRequestError
        && error.code === 'P2034'
        && attempt < TRANSACTION_RETRY_LIMIT;
      if (!canRetry) throw error;
    }
  }
  throw new Error('Serializable transaction retry limit reached.');
}
