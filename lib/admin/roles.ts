export const ADMIN_VIEW_MODE_COOKIE = 'pmc-plan-admin-mode';
export const ADMIN_DEBUG_MODE_COOKIE = 'pmc-plan-admin-debug';
export type AdminViewMode = 'user' | 'admin' | 'super_admin';
export const ASSIGNABLE_ROLES = ['user', 'admin'] as const;
export type AssignableRole = typeof ASSIGNABLE_ROLES[number];

const modeRank: Record<AdminViewMode, number> = {
  user: 0,
  admin: 1,
  super_admin: 2,
};

export function getMaximumAdminViewMode(role?: string): AdminViewMode {
  if (role === 'super_admin') return 'super_admin';
  if (role === 'admin') return 'admin';
  return 'user';
}

export function isAdministrationRole(role?: string): boolean {
  return role === 'admin' || role === 'super_admin';
}

export function isSuperAdminRole(role?: string): boolean {
  return role === 'super_admin';
}

export function canAssignRole(
  actorRole: string | undefined,
  currentRole: string,
  nextRole: AssignableRole,
): boolean {
  if (currentRole === 'super_admin' || currentRole === nextRole) return false;

  if (currentRole === 'pending') {
    return isAdministrationRole(actorRole) && nextRole === 'user';
  }

  return isSuperAdminRole(actorRole)
    && (
      (currentRole === 'user' && nextRole === 'admin')
      || (currentRole === 'admin' && nextRole === 'user')
    );
}

export function canDeleteUserAccount(
  actorRole: string | undefined,
  targetRole: string,
  isOwnAccount: boolean,
): boolean {
  if (isOwnAccount || targetRole === 'super_admin') return false;
  if (isSuperAdminRole(actorRole)) return true;
  return actorRole === 'admin'
    && (targetRole === 'pending' || targetRole === 'user');
}

export function canUseAdminViewMode(
  role: string | undefined,
  mode: AdminViewMode,
): boolean {
  return modeRank[mode] <= modeRank[getMaximumAdminViewMode(role)];
}

export function getEffectiveRole(
  realRole: string | undefined,
  mode: AdminViewMode,
) {
  if (!isAdministrationRole(realRole)) return realRole;
  return canUseAdminViewMode(realRole, mode) ? mode : realRole;
}

export function parseAdminViewMode(value: string | null): AdminViewMode | null {
  if (value === 'true') return 'admin';
  if (value === 'false' || value === 'normal') return 'user';
  if (value === 'user' || value === 'admin' || value === 'super_admin') return value;
  return null;
}
