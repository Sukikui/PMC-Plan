import {
  canAssignRole,
  canDeleteUserAccount,
  canUseAdminViewMode,
  getEffectiveRole,
  getMaximumAdminViewMode,
  isAdministrationRole,
  isSuperAdminRole,
} from '@/lib/admin/roles';

describe('admin view roles', () => {
  it('limits each role to its own level and lower levels', () => {
    expect(canUseAdminViewMode('pending', 'user')).toBe(true);
    expect(canUseAdminViewMode('pending', 'admin')).toBe(false);
    expect(canUseAdminViewMode('user', 'user')).toBe(true);
    expect(canUseAdminViewMode('user', 'admin')).toBe(false);
    expect(canUseAdminViewMode('admin', 'user')).toBe(true);
    expect(canUseAdminViewMode('admin', 'admin')).toBe(true);
    expect(canUseAdminViewMode('admin', 'super_admin')).toBe(false);
    expect(canUseAdminViewMode('super_admin', 'user')).toBe(true);
    expect(canUseAdminViewMode('super_admin', 'admin')).toBe(true);
    expect(canUseAdminViewMode('super_admin', 'super_admin')).toBe(true);
  });

  it('derives an effective role without ever escalating the real role', () => {
    expect(getEffectiveRole('super_admin', 'user')).toBe('user');
    expect(getEffectiveRole('super_admin', 'admin')).toBe('admin');
    expect(getEffectiveRole('admin', 'super_admin')).toBe('admin');
    expect(getEffectiveRole('pending', 'admin')).toBe('pending');
  });

  it('recognizes administration roles', () => {
    expect(getMaximumAdminViewMode('admin')).toBe('admin');
    expect(getMaximumAdminViewMode('super_admin')).toBe('super_admin');
    expect(isAdministrationRole('user')).toBe(false);
    expect(isAdministrationRole('admin')).toBe(true);
    expect(isAdministrationRole('super_admin')).toBe(true);
    expect(isSuperAdminRole('admin')).toBe(false);
    expect(isSuperAdminRole('super_admin')).toBe(true);
  });

  it('separates account approval from administrator promotion', () => {
    expect(canAssignRole('admin', 'pending', 'user')).toBe(true);
    expect(canAssignRole('admin', 'user', 'admin')).toBe(false);
    expect(canAssignRole('super_admin', 'pending', 'user')).toBe(true);
    expect(canAssignRole('super_admin', 'user', 'admin')).toBe(true);
    expect(canAssignRole('super_admin', 'admin', 'user')).toBe(true);
    expect(canAssignRole('super_admin', 'super_admin', 'user')).toBe(false);
  });

  it('limits account deletion according to the administration hierarchy', () => {
    expect(canDeleteUserAccount('admin', 'pending', false)).toBe(true);
    expect(canDeleteUserAccount('admin', 'user', false)).toBe(true);
    expect(canDeleteUserAccount('admin', 'admin', false)).toBe(false);
    expect(canDeleteUserAccount('admin', 'super_admin', false)).toBe(false);
    expect(canDeleteUserAccount('super_admin', 'admin', false)).toBe(true);
    expect(canDeleteUserAccount('super_admin', 'super_admin', false)).toBe(false);
    expect(canDeleteUserAccount('super_admin', 'user', true)).toBe(false);
  });
});
