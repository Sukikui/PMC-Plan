import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { handleMineVerifyRouteError } from '@/lib/mineverify/responses';
import { unlinkMinecraftAccount } from '@/lib/mineverify/service';

export async function POST() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentification requise.' }, { status: 401 });
    }

    const status = await unlinkMinecraftAccount(session.user.id);
    return NextResponse.json(status);
  } catch (error) {
    return handleMineVerifyRouteError(error, 'Impossible de délier le compte Minecraft.');
  }
}
