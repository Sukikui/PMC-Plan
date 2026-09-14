import { NextResponse } from 'next/server';
import {
  getPublicContentPath,
  parsePublicContentPath,
} from '@/lib/content-path';
import { loadSocialPreviewContent } from '@/lib/social-preview/content-data';
import { createSocialPreviewVersion } from '@/lib/social-preview/version';

export async function POST(request: Request) {
  const body = await readBody(request);
  const identity = body ? parsePublicContentPath(body.path) : null;
  if (!identity) {
    return NextResponse.json(
      { error: 'Contenu invalide.' },
      { status: 400 },
    );
  }

  const content = await loadSocialPreviewContent(identity.type, identity.slug);
  if (!content) {
    return NextResponse.json(
      { error: 'Contenu introuvable.' },
      { status: 404 },
    );
  }

  const path = getPublicContentPath(identity.type, identity.slug);
  const imageUrl = new URL(`${path}/image`, request.url);
  imageUrl.searchParams.set(
    'v',
    createSocialPreviewVersion(content.value),
  );
  const response = await fetch(imageUrl.href, {
    cache: 'no-store',
    headers: { 'X-PMC-Social-Preview-Warm': '1' },
  });

  return response.ok
    ? new Response(null, { status: 204 })
    : NextResponse.json(
      { error: 'Impossible de préparer l’aperçu.' },
      { status: 502 },
    );
}

async function readBody(request: Request): Promise<{ path: string } | null> {
  try {
    const body: unknown = await request.json();
    if (
      typeof body === 'object'
      && body !== null
      && 'path' in body
      && typeof body.path === 'string'
    ) {
      return { path: body.path };
    }
  } catch {
    // The response below handles malformed JSON like any invalid payload.
  }
  return null;
}
