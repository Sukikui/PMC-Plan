import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';

const ALLOWED_IMAGE_TYPES = new Set([
  'image/gif',
  'image/jpeg',
  'image/png',
  'image/webp',
]);
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_REDIRECTS = 3;
const DEFAULT_TIMEOUT_MS = 5_000;

export interface RemoteImage {
  bytes: Buffer;
  contentType: string;
}

type RemoteImageResult = RemoteImage | { redirect: string };

interface RemoteImageOptions {
  timeoutMs?: number;
  userAgent?: string;
}

export async function fetchPublicImage(
  source: string,
  options: RemoteImageOptions = {},
): Promise<RemoteImage | null> {
  let currentUrl: URL;
  try {
    currentUrl = new URL(source);
  } catch {
    return null;
  }

  const deadline = Date.now() + (options.timeoutMs ?? DEFAULT_TIMEOUT_MS);
  for (let redirectCount = 0; redirectCount <= MAX_REDIRECTS; redirectCount += 1) {
    if (!await isPublicHttpUrl(currentUrl)) return null;

    const result = await fetchRemoteImage(
      currentUrl,
      deadline - Date.now(),
      options.userAgent,
    );
    if (!result) return null;
    if ('redirect' in result) {
      if (redirectCount === MAX_REDIRECTS) return null;
      try {
        currentUrl = new URL(result.redirect, currentUrl);
      } catch {
        return null;
      }
      continue;
    }
    return result;
  }

  return null;
}

export async function fetchTrustedImage(
  source: string,
  options: RemoteImageOptions = {},
): Promise<RemoteImage | null> {
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
  );
  try {
    const response = await fetch(source, {
      signal: controller.signal,
      headers: options.userAgent ? { 'User-Agent': options.userAgent } : undefined,
    });
    return response.ok ? readImageResponse(response) : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchRemoteImage(
  url: URL,
  timeoutMs: number,
  userAgent?: string,
): Promise<RemoteImageResult | null> {
  if (timeoutMs <= 0) return null;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      redirect: 'manual',
      signal: controller.signal,
      headers: userAgent ? { 'User-Agent': userAgent } : undefined,
    });
    if (response.status >= 300 && response.status < 400) {
      const redirect = response.headers.get('location');
      return redirect ? { redirect } : null;
    }
    return response.ok ? readImageResponse(response) : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function readImageResponse(response: Response): Promise<RemoteImage | null> {
  const contentType = response.headers.get('content-type')
    ?.split(';')[0]
    ?.trim()
    .toLowerCase();
  const contentLength = Number(response.headers.get('content-length'));
  if (
    !contentType
    || !ALLOWED_IMAGE_TYPES.has(contentType)
    || (Number.isFinite(contentLength) && contentLength > MAX_IMAGE_BYTES)
  ) {
    return null;
  }

  const bytes = await readLimitedResponse(response);
  return bytes ? { bytes, contentType } : null;
}

async function readLimitedResponse(response: Response) {
  if (!response.body) return null;
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    totalBytes += value.byteLength;
    if (totalBytes > MAX_IMAGE_BYTES) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }

  return totalBytes > 0 ? Buffer.concat(chunks, totalBytes) : null;
}

async function isPublicHttpUrl(url: URL) {
  if (!['http:', 'https:'].includes(url.protocol)) return false;
  if (url.username || url.password) return false;
  if (url.port && !['80', '443'].includes(url.port)) return false;

  const hostname = url.hostname.toLowerCase().replace(/^\[|\]$/g, '');
  if (
    hostname === 'localhost'
    || hostname.endsWith('.localhost')
    || hostname.endsWith('.local')
    || hostname.endsWith('.internal')
  ) {
    return false;
  }

  if (isIP(hostname)) return !isPrivateAddress(hostname);

  try {
    const addresses = await lookup(hostname, { all: true, verbatim: true });
    return addresses.length > 0
      && addresses.every(({ address }) => !isPrivateAddress(address));
  } catch {
    return false;
  }
}

function isPrivateAddress(address: string) {
  const normalized = address.toLowerCase();
  if (normalized.includes(':')) {
    const embeddedIpv4 = normalized.match(/(\d+(?:\.\d+){3})$/)?.[1];
    if (embeddedIpv4) return isPrivateIpv4(embeddedIpv4);
    const mappedHex = normalized.match(
      /^::(?:ffff:)?([0-9a-f]{1,4}):([0-9a-f]{1,4})$/,
    );
    if (mappedHex) {
      const high = Number.parseInt(mappedHex[1], 16);
      const low = Number.parseInt(mappedHex[2], 16);
      return isPrivateIpv4([
        high >> 8,
        high & 0xff,
        low >> 8,
        low & 0xff,
      ].join('.'));
    }
    return normalized === '::'
      || normalized === '::1'
      || normalized.startsWith('fc')
      || normalized.startsWith('fd')
      || /^fe[89a-f]/.test(normalized)
      || normalized.startsWith('ff');
  }
  return isPrivateIpv4(normalized);
}

function isPrivateIpv4(address: string) {
  const octets = address.split('.').map(Number);
  if (octets.length !== 4 || octets.some((octet) => !Number.isInteger(octet))) {
    return true;
  }
  const [first, second] = octets;
  return first === 0
    || first === 10
    || first === 127
    || (first === 100 && second >= 64 && second <= 127)
    || (first === 169 && second === 254)
    || (first === 172 && second >= 16 && second <= 31)
    || (first === 192 && second === 168)
    || first >= 224;
}
