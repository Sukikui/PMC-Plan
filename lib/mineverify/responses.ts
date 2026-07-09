import { NextResponse } from 'next/server';
import { z } from 'zod';
import { MineVerifyServiceError } from './errors';

export function handleMineVerifyRouteError(error: unknown, fallbackMessage: string) {
  if (error instanceof z.ZodError) {
    return NextResponse.json(
      { error: error.issues[0]?.message ?? 'Requête MineVerify invalide.' },
      { status: 400 }
    );
  }

  if (error instanceof MineVerifyServiceError) {
    return NextResponse.json({ error: error.message }, { status: error.statusCode });
  }

  console.error(fallbackMessage, error);
  return NextResponse.json({ error: fallbackMessage }, { status: 500 });
}
