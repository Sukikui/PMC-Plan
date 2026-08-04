'use client';

import { useCallback, useState } from 'react';
import type { Role } from '@prisma/client';
import {
  PRIMARY_MANAGEMENT_TRANSFER_REQUIRED,
  type AdminUserRoleFilter,
  type AdminUserTransferRequest,
  type AdminUsersResponse,
} from '@/lib/admin/users';
import {
  AdminUserApiError,
  deleteAdminUser,
  fetchAdminUsers,
} from '@/lib/admin/client';
import {
  canDeleteUserAccount,
  isAdministrationRole,
  type AdminViewMode,
} from '@/lib/admin/roles';
import { themeColors } from '@/lib/theme-colors';
import IdentitySummary from '@/components/settings/IdentitySummary';
import { ListRow } from '@/components/ui/ListRow';
import UserAvatar from '@/components/ui/UserAvatar';
import { applyMapEntryManagementUpdate } from '@/lib/preload/main-screen';
import { MANAGEMENT_LIST_ROW_HEIGHT_PX } from '@/lib/management/pagination';
import ManagementListFrame from '@/components/settings/management/ManagementListFrame';
import AdminUserDeleteControl from './AdminUserDeleteControl';
import AdminRoleControl from './AdminRoleControl';
import usePaginatedManagementQuery, {
  type ManagementPageData,
} from '@/components/settings/management/usePaginatedManagementQuery';

type AdminUser = AdminUsersResponse['users'][number];

export default function AdminUserList({
  canApproveUsers,
  canManageRoles,
  deleteMode,
  currentUserId,
  onTransferRequired,
  refreshKey,
}: {
  canApproveUsers: boolean;
  canManageRoles: boolean;
  deleteMode: AdminViewMode;
  currentUserId?: string;
  onTransferRequired: (request: AdminUserTransferRequest) => void;
  refreshKey: string;
}) {
  const [filter, setFilter] = useState<AdminUserRoleFilter>('all');
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const load = useCallback(async (
    page: number,
    query: string,
    signal: AbortSignal,
  ) => {
    const response = await fetchAdminUsers({
      page,
      query,
      role: filter,
      signal,
    });
    return { items: response.users, pagination: response.pagination };
  }, [filter]);
  const state = usePaginatedManagementQuery({ load, refreshKey });

  const updateFilter = (value: AdminUserRoleFilter) => {
    setFilter(value);
    state.setPage(1);
  };
  const updateUserRole = (userId: string, role: Role) => {
    state.setData((current) => ({
      ...current,
      items: current.items.map((user) => (
        user.id === userId ? { ...user, role } : user
      )),
    }));
  };
  const removeDeletedUser = (userId: string) => {
    if (state.data.items.length === 1 && state.page > 1) {
      state.setPage((current) => Math.max(1, current - 1));
      return;
    }
    state.setData((current) => removeUserFromResponse(current, userId));
  };
  const deleteUser = async (user: AdminUser) => {
    setDeletingUserId(user.id);
    state.setError(null);

    try {
      const response = await deleteAdminUser(user.id);
      response.managementUpdates.forEach(applyMapEntryManagementUpdate);
      removeDeletedUser(user.id);
    } catch (requestError) {
      if (
        requestError instanceof AdminUserApiError
        && requestError.details.code === PRIMARY_MANAGEMENT_TRANSFER_REQUIRED
        && requestError.details.primaryManagedContent
      ) {
        onTransferRequired({
          user,
          managedContent: requestError.details.primaryManagedContent,
        });
        return;
      }
      state.setError(requestError instanceof Error
        ? requestError.message
        : 'Erreur inconnue.');
    } finally {
      setDeletingUserId(null);
    }
  };

  return (
    <ManagementListFrame
      controls={(
        <div className="flex gap-1">
          {userFilters.map(({ label, value }) => (
            <button
              key={value}
              type="button"
              onClick={() => updateFilter(value)}
              className={`${themeColors.toggle.compactBase} ${
                filter === value
                  ? themeColors.toggle.activeBlue
                  : themeColors.toggle.inactive
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}
      empty={state.data.items.length === 0}
      emptyLabel="Aucun utilisateur trouvé."
      error={state.error}
      loading={state.loading}
      onPageChange={state.setPage}
      onQueryChange={state.setQuery}
      pagination={state.data.pagination}
      query={state.query}
      resultLabel={`utilisateur${state.data.pagination.total > 1 ? 's' : ''}`}
      searchPlaceholder="Rechercher un utilisateur..."
    >
      <div>
        {state.data.items.map((user) => (
          <AdminUserRow
            key={user.id}
            user={user}
            canApproveUsers={canApproveUsers}
            canManageRoles={canManageRoles}
            canDelete={isAdministrationRole(deleteMode)}
            deleteDisabled={
              deletingUserId !== null
              || !canDeleteUserAccount(
                deleteMode,
                user.role,
                user.id === currentUserId,
              )
            }
            deleting={deletingUserId === user.id}
            onError={state.setError}
            onRoleChanged={(role) => updateUserRole(user.id, role)}
            onDelete={() => deleteUser(user)}
          />
        ))}
      </div>
    </ManagementListFrame>
  );
}

const userFilters: Array<{
  label: string;
  value: AdminUserRoleFilter;
}> = [
  { value: 'all', label: 'Tous' },
  { value: 'pending', label: 'En attente' },
  { value: 'administrators', label: 'Administrateurs' },
];

function AdminUserRow({
  user,
  canApproveUsers,
  canManageRoles,
  canDelete,
  deleteDisabled,
  deleting,
  onError,
  onRoleChanged,
  onDelete,
}: {
  user: AdminUser;
  canApproveUsers: boolean;
  canManageRoles: boolean;
  canDelete: boolean;
  deleteDisabled: boolean;
  deleting: boolean;
  onError: (message: string) => void;
  onRoleChanged: (role: Role) => void;
  onDelete: () => void;
}) {
  return (
    <ListRow
      className="relative grid gap-3 pr-8 sm:grid-cols-[9rem_minmax(0,1fr)] sm:items-start"
      style={{ height: MANAGEMENT_LIST_ROW_HEIGHT_PX }}
    >
      <div className="flex min-h-9 items-center">
        <AdminRoleControl
          canApproveUsers={canApproveUsers}
          canManageRoles={canManageRoles}
          userId={user.id}
          role={user.role}
          onError={onError}
          onRoleChanged={onRoleChanged}
        />
      </div>

      <div className="grid min-w-0 gap-0 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:grid-cols-[13rem_minmax(18rem,1fr)]">
        <IdentitySummary
          avatar={(
            <UserAvatar
              src={user.image}
              alt={`Avatar de ${user.name ?? user.username ?? 'l’utilisateur'}`}
              className="h-9 w-9"
            />
          )}
          title={user.name ?? 'Utilisateur'}
          subtitle={user.username ? `@${user.username}` : user.id}
        />

        <AdminUserDeleteControl
          user={user}
          canDelete={canDelete}
          deleteDisabled={deleteDisabled}
          deleting={deleting}
          onDelete={onDelete}
        />
      </div>
    </ListRow>
  );
}

function removeUserFromResponse(
  response: ManagementPageData<AdminUser>,
  userId: string,
): ManagementPageData<AdminUser> {
  const total = Math.max(0, response.pagination.total - 1);
  return {
    items: response.items.filter((user) => user.id !== userId),
    pagination: {
      ...response.pagination,
      total,
      totalPages: Math.max(1, Math.ceil(total / response.pagination.pageSize)),
    },
  };
}
