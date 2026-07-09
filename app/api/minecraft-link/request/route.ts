import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { createMinecraftLinkRequest } from '@/lib/mineverify/service';
import { handleMineVerifyRouteError } from '@/lib/mineverify/responses';

export async function POST() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentification requise.' }, { status: 401 });
    }

    const status = await createMinecraftLinkRequest(session.user.id);
    return NextResponse.json(status, { status: 201 });
  } catch (error) {
    return handleMineVerifyRouteError(error, 'Impossible de créer la demande MineVerify.');
  }
}
