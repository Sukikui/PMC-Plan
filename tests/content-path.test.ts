import { getPublicContentPath } from '@/lib/content-path';

describe('public content paths', () => {
  it.each([
    ['place', 'place-du-marché', '/lieux/place-du-march%C3%A9'],
    ['portal', 'portail-spawn', '/portails/portail-spawn'],
    ['space', 'Valny Frost', '/espaces/Valny%20Frost'],
  ] as const)('builds the %s path', (type, slug, expected) => {
    expect(getPublicContentPath(type, slug)).toBe(expected);
  });
});
