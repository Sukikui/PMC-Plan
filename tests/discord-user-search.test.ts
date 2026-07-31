import {
  buildDiscordUserSearchPath,
  matchesDiscordUserQuery,
  normalizeDiscordUserQuery,
} from '@/lib/discord/user-search';

const user = {
  name: 'Bob Dylan',
  username: 'bob13',
};

describe('Discord user search', () => {
  it.each([
    ['Bob Dylan', 'bob dylan'],
    ['bob13', 'bob13'],
    ['@bob13', 'bob13'],
    ['  @Bob13  ', 'bob13'],
  ])('normalizes %s', (query, expected) => {
    expect(normalizeDiscordUserQuery(query)).toBe(expected);
  });

  it.each([
    'Bob Dylan',
    'bob dylan',
    'bob13',
    '@bob13',
  ])('matches a user with %s', (query) => {
    expect(matchesDiscordUserQuery(user, query)).toBe(true);
  });

  it('rejects unrelated or incomplete queries', () => {
    expect(matchesDiscordUserQuery(user, '@b')).toBe(false);
    expect(matchesDiscordUserQuery(user, 'alice')).toBe(false);
  });

  it.each([
    ['bob13', '/api/users/search?query=bob13'],
    ['@bob13', '/api/users/search?query=bob13'],
    ['  @Bob13  ', '/api/users/search?query=bob13'],
  ])('builds the same request path for %s', (query, expected) => {
    expect(buildDiscordUserSearchPath(query)).toBe(expected);
  });
});
