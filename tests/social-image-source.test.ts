import { lookup } from 'node:dns/promises';
import { loadSocialImageSource } from '@/lib/social-preview/image-source';

jest.mock('node:dns/promises', () => ({
  lookup: jest.fn(),
}));

const lookupMock = lookup as jest.Mock;

describe('social image sources', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    lookupMock.mockResolvedValue([{ address: '93.184.216.34', family: 4 }]);
  });

  afterEach(() => jest.restoreAllMocks());

  it('loads supported images from the public directory', async () => {
    await expect(loadSocialImageSource('/branding/pmc/mark.png')).resolves
      .toMatch(/^data:image\/png;base64,/);
  });

  it('returns null for missing local images', async () => {
    await expect(loadSocialImageSource('/missing.png')).resolves.toBeNull();
  });

  it('rejects paths outside the public directory and unsupported files', async () => {
    await expect(loadSocialImageSource('/../package.json')).resolves.toBeNull();
    await expect(loadSocialImageSource('/robots.txt')).resolves.toBeNull();
  });

  it('rejects private IP addresses before issuing a request', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch')
      .mockRejectedValue(new Error('Unexpected request'));

    await expect(loadSocialImageSource('http://127.0.0.1/image.png')).resolves
      .toBeNull();
    await expect(loadSocialImageSource('http://[::ffff:7f00:1]/image.png')).resolves
      .toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('loads a supported public image within the size limit', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue(new Response(
      new Uint8Array([1, 2, 3]),
      {
        headers: {
          'Content-Length': '3',
          'Content-Type': 'image/png',
        },
      },
    ));

    await expect(loadSocialImageSource('https://images.example/test.png'))
      .resolves.toBe('data:image/png;base64,AQID');
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('follows validated redirects and rejects oversized images', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch')
      .mockResolvedValueOnce(new Response(null, {
        status: 302,
        headers: { Location: 'https://cdn.example/test.png' },
      }))
      .mockResolvedValueOnce(new Response(new Uint8Array([1]), {
        headers: { 'Content-Type': 'image/png' },
      }))
      .mockResolvedValueOnce(new Response(new Uint8Array([1]), {
        headers: {
          'Content-Length': String(10 * 1024 * 1024 + 1),
          'Content-Type': 'image/png',
        },
      }));

    await expect(loadSocialImageSource('https://images.example/redirect'))
      .resolves.toBe('data:image/png;base64,AQ==');
    await expect(loadSocialImageSource('https://images.example/oversized.png'))
      .resolves.toBeNull();
    expect(fetchSpy).toHaveBeenCalledTimes(3);
    expect(lookupMock).toHaveBeenCalledTimes(3);
  });
});
