import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ImageResponse } from 'next/og';
import type { ReactElement } from 'react';

const SOCIAL_PREVIEW_SIZE = { width: 1200, height: 630 } as const;

const socialPreviewFonts = Promise.all([
  readFile(join(process.cwd(), 'public/branding/fonts/Inter-Regular.ttf')),
  readFile(join(process.cwd(), 'public/branding/fonts/Inter-SemiBold.ttf')),
  readFile(join(process.cwd(), 'public/branding/fonts/Inter-Bold.ttf')),
]);

export async function createSocialImageResponse(element: ReactElement) {
  const [regular, semiBold, bold] = await socialPreviewFonts;
  return new ImageResponse(element, {
    ...SOCIAL_PREVIEW_SIZE,
    headers: {
      'Cache-Control': 'public, max-age=0, s-maxage=300, stale-while-revalidate=86400',
    },
    fonts: [
      { name: 'Inter', data: regular, style: 'normal', weight: 400 },
      { name: 'Inter', data: semiBold, style: 'normal', weight: 600 },
      { name: 'Inter', data: bold, style: 'normal', weight: 700 },
    ],
  });
}
