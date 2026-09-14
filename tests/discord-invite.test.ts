import {
  extractDiscordInviteCode,
  resolveDiscordServer,
} from '@/lib/discord/invite';

describe('Discord invite resolution', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it.each([
    ['https://discord.gg/valnyfrost', 'valnyfrost'],
    ['https://discord.com/invite/valny_frost-2', 'valny_frost-2'],
    ['https://ptb.discord.com/invite/abc123?event=1', 'abc123'],
  ])('extracts an invite code from %s', (url, expected) => {
    expect(extractDiscordInviteCode(url)).toBe(expected);
  });

  it.each([
    'http://discord.gg/insecure',
    'https://discord.com/channels/123/456',
    'https://example.com/invite/unsafe',
    'not-a-url',
  ])('rejects unsupported invite URL %s', (url) => {
    expect(extractDiscordInviteCode(url)).toBeNull();
  });

  it('resolves the server identity through the fixed Discord API endpoint', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({
        guild: {
          id: '123456789',
          name: 'ValnyFrost',
          icon: 'server-icon',
        },
      }), { status: 200 }),
    );

    await expect(resolveDiscordServer('https://discord.gg/valnyfrost'))
      .resolves.toEqual({
        id: '123456789',
        name: 'ValnyFrost',
        iconUrl: 'https://cdn.discordapp.com/icons/123456789/server-icon.webp?size=128',
      });
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://discord.com/api/v10/invites/valnyfrost',
      { next: { revalidate: 21600 } },
    );
  });

  it('returns no preview when Discord cannot resolve the invite', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response(null, { status: 404 }),
    );

    await expect(resolveDiscordServer('https://discord.gg/expired'))
      .resolves.toBeNull();
  });
});
