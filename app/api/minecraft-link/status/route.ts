import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getMinecraftLinkStatus } from '@/lib/mineverify/service';
import { handleMineVerifyRouteError } from '@/lib/mineverify/responses';

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentification requise.' }, { status: 401 });
    }

    const status = await getMinecraftLinkStatus(session.user.id);
    return NextResponse.json(status);
  } catch (error) {
    return handleMineVerifyRouteError(error, 'Impossible de lire le statut MineVerify.');
  }
}
