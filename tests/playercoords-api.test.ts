import {
  isSafariBrowser,
  isSafariPlayerCoordsSyncBlocked,
} from '@/lib/playercoords-api';

const SAFARI_USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) '
  + 'AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Safari/605.1.15';

describe('PlayerCoordsAPI browser compatibility', () => {
  it('detects desktop Safari', () => {
    expect(isSafariBrowser(SAFARI_USER_AGENT)).toBe(true);
  });

  it.each([
    'Mozilla/5.0 Chrome/138.0.0.0 Safari/537.36',
    'Mozilla/5.0 Firefox/140.0',
    'Mozilla/5.0 CriOS/138.0.0.0 Mobile/15E148 Safari/604.1',
    'Mozilla/5.0 FxiOS/140.0 Mobile/15E148 Safari/605.1.15',
  ])('does not classify another browser as Safari', (userAgent) => {
    expect(isSafariBrowser(userAgent)).toBe(false);
  });

  it('only blocks Safari synchronization from an HTTPS page', () => {
    expect(isSafariPlayerCoordsSyncBlocked(SAFARI_USER_AGENT, 'https:')).toBe(true);
    expect(isSafariPlayerCoordsSyncBlocked(SAFARI_USER_AGENT, 'http:')).toBe(false);
    expect(isSafariPlayerCoordsSyncBlocked('Mozilla/5.0 Chrome/138.0 Safari/537.36', 'https:'))
      .toBe(false);
  });
});
