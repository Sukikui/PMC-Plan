import { createHash, timingSafeEqual } from 'crypto';

const BEARER_PREFIX = 'Bearer ';

export type MineVerifyAuthError =
  | 'missing-token-config'
  | 'missing-authorization-header'
  | 'invalid-authorization-scheme'
  | 'invalid-token';

export type MineVerifyAuthResult =
  | { authorized: true }
  | { authorized: false; error: MineVerifyAuthError };

export function verifyMineVerifyAuthorization(authorizationHeader: string | null): MineVerifyAuthResult {
  const expectedToken = process.env.MINEVERIFY_TOKEN;

  if (!expectedToken) {
    return { authorized: false, error: 'missing-token-config' };
  }

  if (!authorizationHeader) {
    return { authorized: false, error: 'missing-authorization-header' };
  }

  if (!authorizationHeader.startsWith(BEARER_PREFIX)) {
    return { authorized: false, error: 'invalid-authorization-scheme' };
  }

  const receivedToken = authorizationHeader.slice(BEARER_PREFIX.length).trim();

  if (!receivedToken || !areTokensEqual(receivedToken, expectedToken)) {
    return { authorized: false, error: 'invalid-token' };
  }

  return { authorized: true };
}

const hashToken = (token: string) => createHash('sha256').update(token).digest();

const areTokensEqual = (receivedToken: string, expectedToken: string) =>
  timingSafeEqual(hashToken(receivedToken), hashToken(expectedToken));
