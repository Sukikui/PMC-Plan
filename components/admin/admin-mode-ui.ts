import type { AdminViewMode } from '@/lib/admin/roles';
import { themeColors } from '@/lib/theme-colors';

export const adminModeOptions: Array<{
  label: string;
  value: AdminViewMode;
}> = [
  { value: 'user', label: 'User' },
  { value: 'admin', label: 'Admin' },
  { value: 'super_admin', label: 'Super Admin' },
];

export const adminModeActiveClasses: Record<AdminViewMode, string> = {
  user: themeColors.adminMode.user,
  admin: themeColors.toggle.activePurple,
  super_admin: themeColors.adminMode.superAdmin,
};
