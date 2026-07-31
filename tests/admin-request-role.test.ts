import { getEffectiveRequestRole } from '@/lib/admin/request-role';

const requestWithMode = (
  mode?: string,
  debugModeEnabled = false,
) => new Request('http://localhost/api/test', {
  headers: mode
    ? {
        cookie: [
          `pmc-plan-admin-mode=${mode}`,
          `pmc-plan-admin-debug=${debugModeEnabled}`,
        ].join('; '),
      }
    : undefined,
});

describe('effective request role', () => {
  it('uses the real role when no preview mode is stored', () => {
    expect(getEffectiveRequestRole(requestWithMode(), 'admin')).toBe('admin');
  });

  it('ignores the selected mode while debug mode is disabled', () => {
    expect(getEffectiveRequestRole(
      requestWithMode('user'),
      'super_admin',
    )).toBe('super_admin');
  });

  it('reduces a Super Admin to the selected User mode', () => {
    expect(getEffectiveRequestRole(
      requestWithMode('user', true),
      'super_admin',
    )).toBe('user');
  });

  it('prevents an admin from simulating Super Admin', () => {
    expect(getEffectiveRequestRole(
      requestWithMode('super_admin', true),
      'admin',
    )).toBe('admin');
  });

  it('never elevates a non-administrator from a client cookie', () => {
    expect(getEffectiveRequestRole(
      requestWithMode('super_admin', true),
      'pending',
    )).toBe('pending');
  });

  it('ignores malformed cookie values without failing the request', () => {
    expect(getEffectiveRequestRole(
      requestWithMode('%', true),
      'admin',
    )).toBe('admin');
  });
});
