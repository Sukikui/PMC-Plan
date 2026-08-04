interface SpaceContentCounts {
  offerCount: number;
  placeCount: number;
  portalCount: number;
}

export function formatSpaceContentSummary({
  offerCount,
  placeCount,
  portalCount,
}: SpaceContentCounts) {
  return [
    formatCount(placeCount, 'lieu', 'lieux'),
    formatCount(portalCount, 'portail', 'portails'),
    formatCount(offerCount, 'offre', 'offres'),
  ].filter(Boolean).join(' · ');
}

function formatCount(count: number, singular: string, plural: string) {
  if (count === 0) return null;
  return `${count} ${count === 1 ? singular : plural}`;
}
