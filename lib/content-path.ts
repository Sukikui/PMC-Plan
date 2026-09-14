export type PublicContentType = 'place' | 'portal' | 'space';

const pathSegments: Record<PublicContentType, string> = {
  place: 'lieux',
  portal: 'portails',
  space: 'espaces',
};

export function getPublicContentPath(
  type: PublicContentType,
  slug: string,
) {
  return `/${pathSegments[type]}/${encodeURIComponent(slug)}`;
}
