import type { Role } from '@prisma/client';
import { themeColors } from '@/lib/theme-colors';

export default function AdminRoleBadge({
  role,
  showUser = false,
}: {
  role: Role;
  showUser?: boolean;
}) {
  if (role === 'pending') {
    return (
      <span className={`whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-medium ${themeColors.toggle.inactiveStrong}`}>
        En attente
      </span>
    );
  }

  if (role === 'super_admin') {
    return (
      <span className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${themeColors.adminMode.superAdmin}`}>
        Super Admin
      </span>
    );
  }

  if (role === 'admin') {
    return (
      <span className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${themeColors.adminBubble.badge}`}>
        Admin
      </span>
    );
  }

  if (showUser) {
    return (
      <span className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${themeColors.adminMode.user}`}>
        User
      </span>
    );
  }

  return null;
}
