import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ImageResponse } from 'next/og';
import type { ReactElement } from 'react';
import {
  SOCIAL_PREVIEW_HEIGHT,
  SOCIAL_PREVIEW_WIDTH,
} from './constants';

const socialPreviewFonts = Promise.all([
  readFile(join(process.cwd(), 'public/branding/fonts/Inter-Regular.ttf')),
  readFile(join(process.cwd(), 'public/branding/fonts/Inter-SemiBold.ttf')),
  readFile(join(process.cwd(), 'public/branding/fonts/Inter-Bold.ttf')),
]);

export async function createSocialImageResponse(
  element: ReactElement,
  longLived = false,
) {
  const [regular, semiBold, bold] = await socialPreviewFonts;
  return new ImageResponse(element, {
    width: SOCIAL_PREVIEW_WIDTH,
    height: SOCIAL_PREVIEW_HEIGHT,
    headers: {
      'Cache-Control': longLived
        ? 'public, max-age=86400, immutable'
        : 'public, max-age=0, s-maxage=60, stale-while-revalidate=300',
      ...(longLived ? {
        'Vercel-CDN-Cache-Control': 'public, max-age=31536000',
      } : {}),
    },
    fonts: [
      { name: 'Inter', data: regular, style: 'normal', weight: 400 },
      { name: 'Inter', data: semiBold, style: 'normal', weight: 600 },
      { name: 'Inter', data: bold, style: 'normal', weight: 700 },
    ],
  });
}

export function isSocialPreviewWarmRequest(request: Request) {
  return request.headers.has('x-pmc-social-preview-warm');
}

export function canLongCacheSocialPreview(
  request: Request,
  images: Array<readonly [string | null | undefined, string | null]>,
) {
  return new URL(request.url).searchParams.has('v')
    && images.every(([source, loaded]) => !source || Boolean(loaded));
}
