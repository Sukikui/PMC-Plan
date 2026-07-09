import { NextRequest, NextResponse } from 'next/server';
import { rejectUnauthorizedMineVerifyRequest } from '@/lib/mineverify/http';
import { listPendingMineVerifyRequests } from '@/lib/mineverify/service';
import { handleMineVerifyRouteError } from '@/lib/mineverify/responses';

export async function GET(request: NextRequest) {
  const unauthorizedResponse = rejectUnauthorizedMineVerifyRequest(request);

  if (unauthorizedResponse) {
    return unauthorizedResponse;
  }

  try {
    return NextResponse.json({ requests: listPendingMineVerifyRequests() });
  } catch (error) {
    return handleMineVerifyRouteError(error, 'Impossible de lister les demandes MineVerify.');
  }
}
