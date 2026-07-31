import {
  DEFAULT_MINECRAFT_HEAD_PLAYER,
  getDefaultMinecraftHeadUrl,
  getMinecraftBodyUrl,
  getMinecraftHeadUrl,
  getMinecraftHeadSources,
} from '../lib/minecraft-head-service';

describe('minecraft head service', () => {
  describe('head URLs', () => {
    it('builds an MC Heads URL with an encoded player identifier', () => {
      expect(getMinecraftHeadUrl('Player Name', 64)).toBe(
        'https://api.mcheads.org/ioshead/Player%20Name/right/64',
      );
    });

    it('uses the shared high-resolution source size', () => {
      expect(getMinecraftHeadUrl('Notch')).toBe(
        'https://api.mcheads.org/ioshead/Notch/right/256',
      );
    });

    it('keeps requested sizes within the supported range', () => {
      expect(getMinecraftHeadUrl('Notch', 8)).toBe(
        'https://api.mcheads.org/ioshead/Notch/right/16',
      );
      expect(getMinecraftHeadUrl('Notch', 1024)).toBe(
        'https://api.mcheads.org/ioshead/Notch/right/512',
      );
    });
  });

  describe('body URLs', () => {
    it('builds the high-resolution iOS body URL', () => {
      expect(getMinecraftBodyUrl('Player Name')).toBe(
        'https://api.mcheads.org/iosbody/Player%20Name/right/512',
      );
    });

    it('keeps requested body sizes within the supported range', () => {
      expect(getMinecraftBodyUrl('Notch', 8)).toBe(
        'https://api.mcheads.org/iosbody/Notch/right/16',
      );
      expect(getMinecraftBodyUrl('Notch', 1024)).toBe(
        'https://api.mcheads.org/iosbody/Notch/right/512',
      );
    });
  });

  it('uses the local MHF Steve head for unlinked accounts', () => {
    expect(DEFAULT_MINECRAFT_HEAD_PLAYER).toBe('MHF_steve');
    expect(getMinecraftHeadUrl(DEFAULT_MINECRAFT_HEAD_PLAYER)).toBe(
      '/assets/minecraft/default-player-head.png',
    );
  });

  it('never calls the provider for blank or differently cased default identifiers', () => {
    expect(getMinecraftHeadUrl('')).toBe(
      '/assets/minecraft/default-player-head.png',
    );
    expect(getMinecraftHeadUrl('mhf_steve')).toBe(
      '/assets/minecraft/default-player-head.png',
    );
  });

  it('uses the local asset as the default Minecraft head', () => {
    expect(getDefaultMinecraftHeadUrl()).toBe(
      '/assets/minecraft/default-player-head.png',
    );
  });

  it('keeps synced, linked and local head sources in priority order', () => {
    expect(getMinecraftHeadSources('synced-uuid', 'linked-uuid')).toEqual([
      'https://api.mcheads.org/ioshead/synced-uuid/right/256',
      'https://api.mcheads.org/ioshead/linked-uuid/right/256',
      '/assets/minecraft/default-player-head.png',
    ]);
  });

  it('skips missing and duplicate remote head sources', () => {
    expect(getMinecraftHeadSources(null, 'linked-uuid', 'linked-uuid')).toEqual([
      'https://api.mcheads.org/ioshead/linked-uuid/right/256',
      '/assets/minecraft/default-player-head.png',
    ]);
  });
});
