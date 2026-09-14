import {
  getPublicContentPath,
  parsePublicContentPath,
} from '@/lib/content-path';

describe('public content paths', () => {
  it.each([
    ['place', 'place-du-marché', '/lieux/place-du-march%C3%A9'],
    ['portal', 'portail-spawn', '/portails/portail-spawn'],
    ['space', 'Valny Frost', '/espaces/Valny%20Frost'],
  ] as const)('builds the %s path', (type, slug, expected) => {
    expect(getPublicContentPath(type, slug)).toBe(expected);
  });
});

describe('public content path parsing', () => {
  it('parses supported encoded paths', () => {
    expect(parsePublicContentPath('/lieux/place-du-march%C3%A9')).toEqual({
      slug: 'place-du-marché',
      type: 'place',
    });
    expect(parsePublicContentPath('/portails/spawn')).toEqual({
      slug: 'spawn',
      type: 'portal',
    });
  });

  it.each([
    '/services/redstone',
    '/lieux/place/image',
    '/lieux/%E0%A4%A',
  ])('rejects unsupported path %s', (path) => {
    expect(parsePublicContentPath(path)).toBeNull();
  });
});
