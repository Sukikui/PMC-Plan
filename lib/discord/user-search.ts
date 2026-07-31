export interface SearchableDiscordUser {
  name: string | null;
  username: string | null;
}

export function normalizeDiscordUserQuery(query: string) {
  return query
    .trim()
    .replace(/^@+\s*/, '')
    .trim()
    .toLowerCase();
}

export function buildDiscordUserSearchPath(query: string) {
  const normalizedQuery = normalizeDiscordUserQuery(query);
  if (normalizedQuery.length < 2) return null;
  return `/api/users/search?query=${encodeURIComponent(normalizedQuery)}`;
}

export function matchesDiscordUserQuery(
  user: SearchableDiscordUser,
  query: string,
) {
  const normalizedQuery = normalizeDiscordUserQuery(query);
  if (normalizedQuery.length < 2) return false;

  return [user.name, user.username].some((value) => (
    value?.toLowerCase().includes(normalizedQuery)
  ));
}
