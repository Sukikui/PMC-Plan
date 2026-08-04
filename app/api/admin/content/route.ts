import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { isAdministrationRole } from '@/lib/admin/roles';
import { getEffectiveRequestRole } from '@/lib/admin/request-role';
import { contentManagementQuerySchema } from '@/lib/content-management/params';
import { listContentManagement } from '@/lib/content-management/query';

export async function GET(request: NextRequest) {
  const session = await auth();
  const actorRole = getEffectiveRequestRole(request, session?.user?.role);
  if (!isAdministrationRole(actorRole)) {
    return NextResponse.json(
      { error: 'Accès administrateur requis.' },
      { status: 403 },
    );
  }

  const query = contentManagementQuerySchema.safeParse(
    Object.fromEntries(request.nextUrl.searchParams),
  );
  if (!query.success) {
    return NextResponse.json(
      { error: 'Paramètres de recherche invalides.' },
      { status: 400 },
    );
  }

  return NextResponse.json(await listContentManagement(query.data));
}
