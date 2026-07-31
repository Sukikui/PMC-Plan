import { getServiceContactHref } from '@/lib/services/contact';

const primaryManager = {
  id: 'discord-user-id',
  name: 'Suki',
  username: 'suki',
  image: null,
};

describe('service contact', () => {
  it('derives the primary manager Discord profile URL', () => {
    expect(getServiceContactHref({
      contactType: 'primary_manager',
      contactDiscordUrl: null,
      primaryManager,
    })).toBe('https://discord.com/users/discord-user-id');
  });

  it('uses only the custom URL in custom mode', () => {
    expect(getServiceContactHref({
      contactType: 'custom',
      contactDiscordUrl: 'https://discord.gg/example',
      primaryManager,
    })).toBe('https://discord.gg/example');
  });

  it('exposes no contact in none mode', () => {
    expect(getServiceContactHref({
      contactType: 'none',
      contactDiscordUrl: null,
      primaryManager,
    })).toBeNull();
  });
});
