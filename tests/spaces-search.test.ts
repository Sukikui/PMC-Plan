import { filterSpaces } from '@/lib/spaces/search';
import type { Space } from '@/lib/spaces/types';

const spaces = [
  {
    name: 'ValnyFrost',
    slug: 'valnyfrost',
    description: 'Une ville au cœur des montagnes.',
    members: [{ uuid: 'member-suki', name: '_Suki_' }],
  },
  {
    name: 'Marché impérial',
    slug: 'marche-imperial',
    description: 'Un espace dédié au commerce.',
    members: [{ uuid: 'member-alex', name: 'Alex' }],
  },
] as Space[];

describe('space search', () => {
  it.each([
    ['valny', 'ValnyFrost'],
    ['marche-imperial', 'Marché impérial'],
    ['commerce', 'Marché impérial'],
    ['_Suki_', 'ValnyFrost'],
  ])('finds spaces by "%s"', (query, expectedName) => {
    expect(filterSpaces(spaces, query).map(({ name }) => name))
      .toEqual([expectedName]);
  });

  it('returns every space for an empty query', () => {
    expect(filterSpaces(spaces, '')).toBe(spaces);
  });
});
