import { resolvePlaceDiscordUrl } from '@/lib/place/discord';
import type { SpaceReference } from '@/lib/spaces/types';

const space: SpaceReference = {
  id: 'space-1',
  slug: 'valnyfrost',
  name: 'ValnyFrost',
  color: '#3B82F6',
  logoUrl: null,
  logoBackground: 'color',
  logoZoom: 1,
  discordUrl: 'https://discord.gg/valnyfrost',
};

describe('place Discord resolution', () => {
  it('inherits the space Discord URL without a place override', () => {
    expect(resolvePlaceDiscordUrl(null, space))
      .toBe('https://discord.gg/valnyfrost');
  });

  it('prefers the place override over the space Discord URL', () => {
    expect(resolvePlaceDiscordUrl('https://discord.gg/place', space))
      .toBe('https://discord.gg/place');
  });

  it('returns no URL when neither source defines one', () => {
    expect(resolvePlaceDiscordUrl(null, null)).toBeNull();
  });
});
