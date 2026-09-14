import { readFile } from 'node:fs/promises';
import { resolve, sep } from 'node:path';
import {
  fetchPublicImage,
  fetchTrustedImage,
  type RemoteImage,
} from '@/lib/media/remote-image';
import { getCachedUserImageUrl } from '@/lib/media/user-image';

const SOCIAL_IMAGE_USER_AGENT = 'PMC-Plan-Social-Preview/1.0';
const SOCIAL_USER_IMAGE_TIMEOUT_MS = 2_000;
const SOCIAL_USER_IMAGE_WARM_TIMEOUT_MS = 7_000;
const localImageCache = new Map<string, Promise<string | null>>();

export async function loadSocialImageSource(
  source: string | null | undefined,
  fallbackPublicPath?: string,
) {
  const image = source
    ? await loadImageSource(source)
    : null;
  if (image) return image;
  return fallbackPublicPath
    ? loadLocalPublicImage(fallbackPublicPath)
    : null;
}

async function loadImageSource(source: string) {
  if (source.startsWith('/')) return loadLocalPublicImage(source);
  return toDataUrl(await fetchPublicImage(source, {
    userAgent: SOCIAL_IMAGE_USER_AGENT,
  }));
}

export async function loadSocialUserImageSource(
  source: string | null | undefined,
  requestUrl: string,
  warm = false,
) {
  if (!source) return null;
  if (source.startsWith('/')) return loadLocalPublicImage(source);

  const proxyUrl = new URL(getCachedUserImageUrl(source), requestUrl);
  return toDataUrl(await fetchTrustedImage(proxyUrl.href, {
    timeoutMs: warm
      ? SOCIAL_USER_IMAGE_WARM_TIMEOUT_MS
      : SOCIAL_USER_IMAGE_TIMEOUT_MS,
    userAgent: SOCIAL_IMAGE_USER_AGENT,
  }));
}

function loadLocalPublicImage(publicPath: string) {
  const normalizedPath = publicPath.replace(/^\/+/, '');
  const existing = localImageCache.get(normalizedPath);
  if (existing) return existing;

  const contentType = getLocalImageType(normalizedPath);
  const publicRoot = resolve(process.cwd(), 'public');
  const absolutePath = resolve(publicRoot, normalizedPath);
  if (
    !contentType
    || absolutePath === publicRoot
    || !absolutePath.startsWith(`${publicRoot}${sep}`)
  ) {
    return Promise.resolve(null);
  }

  const loaded = readFile(absolutePath, 'base64')
    .then((contents) => `data:${contentType};base64,${contents}`)
    .catch(() => null);
  localImageCache.set(normalizedPath, loaded);
  return loaded;
}

function getLocalImageType(path: string) {
  if (/\.png$/i.test(path)) return 'image/png';
  if (/\.jpe?g$/i.test(path)) return 'image/jpeg';
  if (/\.gif$/i.test(path)) return 'image/gif';
  if (/\.webp$/i.test(path)) return 'image/webp';
  return null;
}

function toDataUrl(image: RemoteImage | null) {
  return image
    ? `data:${image.contentType};base64,${image.bytes.toString('base64')}`
    : null;
}
