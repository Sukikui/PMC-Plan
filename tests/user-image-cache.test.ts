import { GET } from '@/app/api/media/user-image/route';
import { prisma } from '@/lib/prisma';
import { fetchPublicImage } from '@/lib/media/remote-image';
import { getCachedUserImageUrl } from '@/lib/media/user-image';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    mapEntry: { findFirst: jest.fn() },
    space: { findFirst: jest.fn() },
  },
}));

jest.mock('@/lib/media/remote-image', () => ({
  fetchPublicImage: jest.fn(),
}));

const mockedPrisma = prisma as unknown as {
  mapEntry: { findFirst: jest.Mock };
  space: { findFirst: jest.Mock };
};
const mockedFetchPublicImage = fetchPublicImage as jest.Mock;

describe('user image cache URL', () => {
  it('proxies remote user images without rewriting local assets', () => {
    expect(getCachedUserImageUrl('https://images.example/place.png'))
      .toBe('/api/media/user-image?url=https%3A%2F%2Fimages.example%2Fplace.png');
    expect(getCachedUserImageUrl('/branding/pmc/mark.png'))
      .toBe('/branding/pmc/mark.png');
  });
});

describe('user image cache route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedPrisma.mapEntry.findFirst.mockResolvedValue(null);
    mockedPrisma.space.findFirst.mockResolvedValue(null);
  });

  it('rejects invalid and unreferenced URLs without contacting their origin', async () => {
    const invalid = await GET(new Request(
      'http://localhost/api/media/user-image?url=file%3A%2F%2Fprivate',
    ));
    expect(invalid.status).toBe(400);

    const missing = await GET(new Request(
      'http://localhost/api/media/user-image?url=https%3A%2F%2Fimages.example%2Fmissing.png',
    ));
    expect(missing.status).toBe(404);
    expect(missing.headers.get('cache-control')).toBe('no-store');
    expect(mockedFetchPublicImage).not.toHaveBeenCalled();
  });

  it('serves a referenced image with long browser and Vercel cache policies', async () => {
    mockedPrisma.mapEntry.findFirst.mockResolvedValue({ id: 'entry-id' });
    mockedFetchPublicImage.mockResolvedValue({
      bytes: Buffer.from([1, 2, 3]),
      contentType: 'image/png',
    });

    const response = await GET(new Request(
      'http://localhost/api/media/user-image?url=https%3A%2F%2Fimages.example%2Fplace.png',
    ));

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control'))
      .toBe('public, max-age=86400, immutable');
    expect(response.headers.get('vercel-cdn-cache-control'))
      .toBe('public, max-age=31536000');
    expect(response.headers.get('content-type')).toBe('image/png');
    expect(new Uint8Array(await response.arrayBuffer()))
      .toEqual(new Uint8Array([1, 2, 3]));
    expect(mockedFetchPublicImage).toHaveBeenCalledWith(
      'https://images.example/place.png',
      { userAgent: 'PMC-Plan-User-Image-Cache/1.0' },
    );
  });

  it('accepts space logos and never caches origin failures', async () => {
    mockedPrisma.space.findFirst.mockResolvedValue({ id: 'space-id' });
    mockedFetchPublicImage.mockResolvedValue(null);

    const response = await GET(new Request(
      'http://localhost/api/media/user-image?url=https%3A%2F%2Fimages.example%2Flogo.webp',
    ));

    expect(response.status).toBe(502);
    expect(response.headers.get('cache-control')).toBe('no-store');
  });
});
