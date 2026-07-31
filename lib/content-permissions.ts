import { isAdministrationRole } from '@/lib/admin/roles';

interface ManagedContentAccess {
  primaryManagerId: string;
  managerIds: string[];
}

export function canContribute(role?: string): boolean {
  return role === 'user' || isAdministrationRole(role);
}

export function canManageContent(
  role: string | undefined,
  userId: string | undefined,
  access: ManagedContentAccess,
): boolean {
  if (isAdministrationRole(role)) return true;
  if (!canContribute(role) || !userId) return false;
  return access.primaryManagerId === userId || access.managerIds.includes(userId);
}

export function canAdministerContent(
  role: string | undefined,
  userId: string | undefined,
  primaryManagerId: string,
): boolean {
  if (isAdministrationRole(role)) return true;
  return canContribute(role) && Boolean(userId) && userId === primaryManagerId;
}
