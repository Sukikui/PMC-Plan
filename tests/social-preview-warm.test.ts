import { POST } from '@/app/api/social-preview/warm/route';
import { loadSocialPreviewContent } from '@/lib/social-preview/content-data';
import { createSocialPreviewVersion } from '@/lib/social-preview/version';

jest.mock('@/lib/social-preview/content-data', () => ({
  loadSocialPreviewContent: jest.fn(),
}));

const mockedLoadContent = loadSocialPreviewContent as jest.Mock;

describe('social preview warmup', () => {
  beforeEach(() => jest.clearAllMocks());

  afterEach(() => jest.restoreAllMocks());

  it('warms the versioned image route for a known public content path', async () => {
    const content = {
      mapEntryId: 'entry-id',
      name: 'Marché',
      updatedAt: new Date('2026-09-15T10:00:00.000Z'),
    };
    mockedLoadContent.mockResolvedValue({ type: 'place', value: content });
    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response('image', { status: 200 }),
    );

    const response = await POST(new Request(
      'https://pmc-plan.vercel.app/api/social-preview/warm',
      {
        body: JSON.stringify({ path: '/lieux/marche' }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      },
    ));

    expect(response.status).toBe(204);
    expect(fetchSpy).toHaveBeenCalledWith(
      `https://pmc-plan.vercel.app/lieux/marche/image?v=${createSocialPreviewVersion(content)}`,
      {
        cache: 'no-store',
        headers: { 'X-PMC-Social-Preview-Warm': '1' },
      },
    );
  });

  it('rejects malformed paths before loading content', async () => {
    const response = await POST(new Request(
      'http://localhost/api/social-preview/warm',
      {
        body: JSON.stringify({ path: 'https://example.com/image' }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      },
    ));

    expect(response.status).toBe(400);
    expect(mockedLoadContent).not.toHaveBeenCalled();
  });

  it('changes the image version when rendered content changes', () => {
    expect(createSocialPreviewVersion({ name: 'A' }))
      .not.toBe(createSocialPreviewVersion({ name: 'B' }));
  });
});
