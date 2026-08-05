import type { Prisma } from '@prisma/client';

export const validTradeOfferWhere = {
  items: { some: { kind: 'gives' as const } },
} satisfies Prisma.TradeOfferWhereInput;
