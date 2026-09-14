const USER_IMAGE_CACHE_PATH = '/api/media/user-image';

export function getCachedUserImageUrl(source: string): string;
export function getCachedUserImageUrl(source: null): null;
export function getCachedUserImageUrl(source: undefined): undefined;
export function getCachedUserImageUrl(
  source: string | null | undefined,
): string | null | undefined;
export function getCachedUserImageUrl(
  source: string | null | undefined,
) {
  if (!source || source.startsWith('/')) return source;

  try {
    const url = new URL(source);
    if (!['http:', 'https:'].includes(url.protocol)) return source;
  } catch {
    return source;
  }

  return `${USER_IMAGE_CACHE_PATH}?url=${encodeURIComponent(source)}`;
}
