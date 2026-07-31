import type { Space } from './types';

export function filterSpaces(spaces: Space[], query: string) {
  const normalizedQuery = normalizeSearch(query);
  if (!normalizedQuery) return spaces;

  return spaces.filter((space) => [
    space.name,
    space.slug,
    space.description,
    ...space.members.map(({ name }) => name),
  ].some((value) => normalizeSearch(value).includes(normalizedQuery)));
}

function normalizeSearch(value?: string | null) {
  return value?.toLocaleLowerCase('fr').replace(/\s+/g, '') ?? '';
}
