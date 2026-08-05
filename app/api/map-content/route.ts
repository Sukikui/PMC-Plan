import { NextResponse } from 'next/server';
import { loadMapContent } from '@/lib/map-content/server';

export async function GET() {
  return NextResponse.json(await loadMapContent());
}
