import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { CONTENT_IMAGE_URL_MAX_LENGTH } from '@/lib/content/images';
import { fetchPublicImage } from '@/lib/media/remote-image';

const BROWSER_CACHE_SECONDS = 86_400;
const VERCEL_CACHE_SECONDS = 31_536_000;

export async function GET(request: Request) {
  const source = new URL(request.url).searchParams.get('url')?.trim();
  if (!source || source.length > CONTENT_IMAGE_URL_MAX_LENGTH || !isHttpUrl(source)) {
    return errorResponse('URL d’image invalide.', 400);
  }

  if (!await isReferencedUserImage(source)) {
    return errorResponse('Image introuvable.', 404);
  }

  const image = await fetchPublicImage(source, {
    userAgent: 'PMC-Plan-User-Image-Cache/1.0',
  });
  if (!image) {
    return errorResponse('Impossible de charger l’image.', 502);
  }

  return new Response(new Uint8Array(image.bytes), {
    headers: {
      'Cache-Control': `public, max-age=${BROWSER_CACHE_SECONDS}, immutable`,
      'Content-Length': String(image.bytes.byteLength),
      'Content-Type': image.contentType,
      'Vercel-CDN-Cache-Control': `public, max-age=${VERCEL_CACHE_SECONDS}`,
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

async function isReferencedUserImage(source: string) {
  const [mapEntry, space] = await Promise.all([
    prisma.mapEntry.findFirst({
      where: { images: { has: source } },
      select: { id: true },
    }),
    prisma.space.findFirst({
      where: { logoUrl: source },
      select: { id: true },
    }),
  ]);
  return Boolean(mapEntry || space);
}

function errorResponse(message: string, status: number) {
  return NextResponse.json(
    { error: message },
    {
      status,
      headers: {
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    },
  );
}

function isHttpUrl(source: string) {
  try {
    return ['http:', 'https:'].includes(new URL(source).protocol);
  } catch {
    return false;
  }
}
