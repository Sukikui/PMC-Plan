import { NextRequest, NextResponse } from 'next/server';
import { verifyMineVerifyAuthorization } from './auth';

export function rejectUnauthorizedMineVerifyRequest(request: NextRequest) {
  const authResult = verifyMineVerifyAuthorization(request.headers.get('authorization'));

  if (authResult.authorized) {
    return null;
  }

  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
