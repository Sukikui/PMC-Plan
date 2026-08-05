import { NextRequest, NextResponse } from 'next/server';
import { getPagination } from '@/lib/api/pagination';
import { loadMarketOffers } from '@/lib/market/server';

export async function GET(request: NextRequest) {
  const { page, pageSize } = getPagination(request.nextUrl.searchParams, 30);
  const query = request.nextUrl.searchParams.get('q')?.trim() ?? '';
  return NextResponse.json(await loadMarketOffers(page, pageSize, query));
}
