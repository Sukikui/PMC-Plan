import { loadSocialImageSource } from '@/lib/social-preview/image-source';

describe('social image sources', () => {
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
});
