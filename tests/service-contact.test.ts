import { getServiceContactHref } from '@/lib/services/contact';

const discordId = '374562243779493889';

describe('service contact', () => {
  it('derives the primary manager Discord profile URL', () => {
    expect(getServiceContactHref(
      'primary_manager',
      null,
      discordId,
    )).toBe(`https://discord.com/users/${discordId}`);
  });

  it('uses only the custom URL in custom mode', () => {
    expect(getServiceContactHref(
      'custom',
      'https://discord.gg/example',
      discordId,
    )).toBe('https://discord.gg/example');
  });

  it('exposes no contact in none mode', () => {
    expect(getServiceContactHref('none', null, discordId)).toBeNull();
  });
});
