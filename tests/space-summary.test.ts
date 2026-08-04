import { formatSpaceContentSummary } from '@/lib/spaces/summary';

describe('space content summary', () => {
  it('omits empty content types', () => {
    expect(formatSpaceContentSummary({
      offerCount: 0,
      placeCount: 0,
      portalCount: 1,
    })).toBe('1 portail');
  });

  it('formats every populated content type', () => {
    expect(formatSpaceContentSummary({
      offerCount: 3,
      placeCount: 1,
      portalCount: 2,
    })).toBe('1 lieu · 2 portails · 3 offres');
  });
});
