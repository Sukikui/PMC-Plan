import { NextRequest, NextResponse } from 'next/server';
import { loadMapEntryDetail } from '@/lib/map-content/detail-server';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const type = request.nextUrl.searchParams.get('type');
  if (type !== 'place' && type !== 'portal') {
    return NextResponse.json(
      { error: 'Type de contenu invalide.' },
      { status: 400 },
    );
  }

  const item = await loadMapEntryDetail(type, id);

  if (!item) {
    return NextResponse.json(
      { error: 'Contenu introuvable.' },
      { status: 404 },
    );
  }

  return NextResponse.json({ item, type });
}
