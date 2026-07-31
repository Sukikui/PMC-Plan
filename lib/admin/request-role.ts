import {
  ADMIN_DEBUG_MODE_COOKIE,
  ADMIN_VIEW_MODE_COOKIE,
  getEffectiveRole,
  parseAdminViewMode,
} from './roles';

export function getEffectiveRequestRole(
  request: Request,
  realRole: string | undefined,
) {
  const debugModeEnabled = readCookie(
    request.headers.get('cookie'),
    ADMIN_DEBUG_MODE_COOKIE,
  ) === 'true';
  if (!debugModeEnabled) return realRole;

  const mode = parseAdminViewMode(readCookie(
    request.headers.get('cookie'),
    ADMIN_VIEW_MODE_COOKIE,
  ));
  return mode ? getEffectiveRole(realRole, mode) : realRole;
}

function readCookie(header: string | null, name: string) {
  if (!header) return null;
  for (const value of header.split(';')) {
    const separator = value.indexOf('=');
    if (separator < 0) continue;
    if (value.slice(0, separator).trim() !== name) continue;
    const encodedValue = value.slice(separator + 1).trim();
    try {
      return decodeURIComponent(encodedValue);
    } catch {
      return encodedValue;
    }
  }
  return null;
}
