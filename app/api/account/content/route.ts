import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { contentManagementQuerySchema } from '@/lib/content-management/params';
import { listContentManagement } from '@/lib/content-management/query';

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: 'Connexion Discord requise.' },
      { status: 401 },
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

  return NextResponse.json(await listContentManagement({
    ...query.data,
    managerId: session.user.id,
  }));
}
