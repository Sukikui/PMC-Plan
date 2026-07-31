'use client';

import { useSession } from 'next-auth/react';
import { useAdminMode } from '@/components/admin/AdminModeProvider';
import SectionSeparator from '@/components/ui/SectionSeparator';
import { themeColors } from '@/lib/theme-colors';
import AdminDebugModeToggle from './AdminDebugModeToggle';
import AdminUserList from './AdminUserList';
import { isAdministrationRole } from '@/lib/admin/roles';
import type { AdminUserTransferRequest } from '@/lib/admin/users';

export default function AdminSettings({
  onTransferRequired,
  usersRefreshKey,
}: {
  onTransferRequired: (request: AdminUserTransferRequest) => void;
  usersRefreshKey: string;
}) {
  const { data: session } = useSession();
  const { effectiveRole, mode } = useAdminMode();
  const showUsers = isAdministrationRole(effectiveRole);

  return (
    <div>
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className={`text-sm font-medium ${themeColors.text.primary}`}>Mode debug</h3>
            <p className={`mt-0.5 text-xs ${themeColors.text.tertiary}`}>
              Prévisualise les droits des différents rôles depuis l’ensemble de l’app.
            </p>
          </div>
          <AdminDebugModeToggle />
        </div>
      </section>

      {showUsers && (
        <>
          <SectionSeparator className="my-6" />
          <section className="space-y-4">
            <div>
              <h3 className={`text-sm font-medium ${themeColors.text.primary}`}>Utilisateurs</h3>
              <p className={`mt-0.5 text-xs ${themeColors.text.tertiary}`}>
                Consulte les comptes enregistrés et leur niveau de droits.
              </p>
            </div>
            <AdminUserList
              canApproveUsers
              canManageRoles={effectiveRole === 'super_admin'}
              deleteMode={mode}
              currentUserId={session?.user?.id}
              onTransferRequired={onTransferRequired}
              refreshKey={usersRefreshKey}
            />
          </section>
        </>
      )}
    </div>
  );
}
