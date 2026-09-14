export type PublicContentType = 'place' | 'portal' | 'space';

const pathSegments: Record<PublicContentType, string> = {
  place: 'lieux',
  portal: 'portails',
  space: 'espaces',
};

const contentTypesBySegment = Object.fromEntries(
  Object.entries(pathSegments).map(([type, segment]) => [segment, type]),
) as Record<string, PublicContentType>;

export function getPublicContentPath(
  type: PublicContentType,
  slug: string,
) {
  return `/${pathSegments[type]}/${encodeURIComponent(slug)}`;
}

export function parsePublicContentPath(path: string) {
  const match = path.match(/^\/(lieux|portails|espaces)\/([^/]+)$/);
  if (!match) return null;

  try {
    return {
      type: contentTypesBySegment[match[1]],
      slug: decodeURIComponent(match[2]),
    };
  } catch {
    return null;
  }
}
