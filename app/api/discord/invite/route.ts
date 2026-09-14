import { NextResponse } from 'next/server';
import { resolveDiscordServer } from '@/lib/discord/invite';

export async function GET(request: Request) {
  const inviteUrl = new URL(request.url).searchParams.get('url');
  if (!inviteUrl) {
    return NextResponse.json(
      { error: 'URL Discord manquante.' },
      { status: 400 },
    );
  }

  try {
    const server = await resolveDiscordServer(inviteUrl);
    return NextResponse.json({ server });
  } catch {
    return NextResponse.json({ server: null });
  }
}
