import { NextRequest, NextResponse } from 'next/server';
import { rejectUnauthorizedMineVerifyRequest } from '@/lib/mineverify/http';
import { MineVerifyExpiredSchema } from '@/lib/mineverify/schemas';
import { markMineVerifyExpired } from '@/lib/mineverify/service';
import { handleMineVerifyRouteError } from '@/lib/mineverify/responses';

export async function POST(request: NextRequest) {
  const unauthorizedResponse = rejectUnauthorizedMineVerifyRequest(request);

  if (unauthorizedResponse) {
    return unauthorizedResponse;
  }

  try {
    const payload = MineVerifyExpiredSchema.parse(await request.json());
    markMineVerifyExpired(payload);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleMineVerifyRouteError(error, 'Impossible d’expirer la demande MineVerify.');
  }
}
