import { NextRequest, NextResponse } from 'next/server';
import { rejectUnauthorizedMineVerifyRequest } from '@/lib/mineverify/http';
import { MineVerifyCodeCreatedSchema } from '@/lib/mineverify/schemas';
import { markMineVerifyCodeCreated } from '@/lib/mineverify/service';
import { handleMineVerifyRouteError } from '@/lib/mineverify/responses';

export async function POST(request: NextRequest) {
  const unauthorizedResponse = rejectUnauthorizedMineVerifyRequest(request);

  if (unauthorizedResponse) {
    return unauthorizedResponse;
  }

  try {
    const payload = MineVerifyCodeCreatedSchema.parse(await request.json());
    markMineVerifyCodeCreated(payload);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleMineVerifyRouteError(error, 'Impossible d’enregistrer le code MineVerify.');
  }
}
