export const MAX_CONTENT_IMAGE_URLS = 10;
export const CONTENT_IMAGE_URL_MAX_LENGTH = 512;

export const normalizeContentImages = (
  images?: Array<string | null | undefined> | null,
) => {
  const urls = (images ?? [])
    .map((url) => url?.trim())
    .filter((url): url is string => Boolean(url));

  return Array.from(new Set(urls)).slice(0, MAX_CONTENT_IMAGE_URLS);
};
