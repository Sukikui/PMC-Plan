import { NextRequest, NextResponse } from 'next/server';
import { rejectUnauthorizedMineVerifyRequest } from '@/lib/mineverify/http';
import { MineVerifyValidatedSchema } from '@/lib/mineverify/schemas';
import { markMineVerifyValidated } from '@/lib/mineverify/service';
import { handleMineVerifyRouteError } from '@/lib/mineverify/responses';

export async function POST(request: NextRequest) {
  const unauthorizedResponse = rejectUnauthorizedMineVerifyRequest(request);

  if (unauthorizedResponse) {
    return unauthorizedResponse;
  }

  try {
    const payload = MineVerifyValidatedSchema.parse(await request.json());
    await markMineVerifyValidated(payload);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleMineVerifyRouteError(error, 'Impossible de valider la liaison MineVerify.');
  }
}
