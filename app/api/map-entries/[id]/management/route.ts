import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getEffectiveRequestRole } from '@/lib/admin/request-role';
import { canManageContent } from '@/lib/content-permissions';
import { getMapEntryManagement } from '@/lib/map-entry/service';

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Authentification requise.' }, { status: 401 });
  }

  const { id } = await context.params;
  const management = await getMapEntryManagement(id);
  if (!management) {
    return NextResponse.json({ error: 'Fiche introuvable.' }, { status: 404 });
  }
  const actorRole = getEffectiveRequestRole(request, session.user.role);
  if (!canManageContent(actorRole, session.user.id, management.access)) {
    return NextResponse.json({ error: 'Accès refusé.' }, { status: 403 });
  }

  return NextResponse.json(management);
}
