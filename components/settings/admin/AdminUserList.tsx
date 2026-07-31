'use client';

import { useEffect, useState } from 'react';
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
import AdminUserDeleteControl from './AdminUserDeleteControl';
import AdminRoleControl from './AdminRoleControl';

const emptyResponse: AdminUsersResponse = {
  users: [],
  pagination: { page: 1, pageSize: 20, total: 0, totalPages: 1 },
};

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
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<AdminUserRoleFilter>('all');
  const [page, setPage] = useState(1);
  const [data, setData] = useState(emptyResponse);
  const [loading, setLoading] = useState(true);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({
        page: String(page),
        query,
        role: filter,
      });

      try {
        const response = await fetch(`/api/admin/users?${params}`, {
          cache: 'no-store',
          signal: controller.signal,
        });
        if (!response.ok) throw new Error('Impossible de charger les utilisateurs.');
        setData(await response.json() as AdminUsersResponse);
      } catch (requestError) {
        if (!controller.signal.aborted) {
          setError(requestError instanceof Error ? requestError.message : 'Erreur inconnue.');
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 250);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [filter, page, query, refreshKey]);

  const updateQuery = (value: string) => {
    setQuery(value);
    setPage(1);
  };

  const updateFilter = (value: AdminUserRoleFilter) => {
    setFilter(value);
    setPage(1);
  };

  const updateUserRole = (userId: string, role: Role) => {
    setData((current) => ({
      ...current,
      users: current.users.map((user) => (
        user.id === userId ? { ...user, role } : user
      )),
    }));
  };

  const deleteUser = async (user: AdminUsersResponse['users'][number]) => {
    setDeletingUserId(user.id);
    setError(null);

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
      setError(requestError instanceof Error ? requestError.message : 'Erreur inconnue.');
    } finally {
      setDeletingUserId(null);
    }
  };

  const removeDeletedUser = (userId: string) => {
    if (data.users.length === 1 && page > 1) {
      setPage((current) => Math.max(1, current - 1));
      return;
    }
    setData((current) => removeUserFromResponse(current, userId));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <input
          type="search"
          value={query}
          onChange={(event) => updateQuery(event.target.value)}
          placeholder="Rechercher un utilisateur..."
          className={`w-full px-3 py-2 text-sm lg:max-w-sm ${themeColors.input.search} border ${themeColors.util.roundedLg} focus:outline-none focus:ring-2 ${themeColors.placeholder}`}
        />
        <div className="flex gap-1">
          {([
            ['all', 'Tous'],
            ['pending', 'En attente'],
            ['administrators', 'Administrateurs'],
          ] as const).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => updateFilter(value)}
              className={`${themeColors.toggle.compactBase} ${
                filter === value ? themeColors.toggle.activeBlue : themeColors.toggle.inactive
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {error && <p className={`text-sm ${themeColors.feedback.errorText}`}>{error}</p>}
      {loading ? (
        <p className={`py-8 text-center text-sm ${themeColors.text.tertiary}`}>Chargement...</p>
      ) : data.users.length === 0 ? (
        <p className={`py-8 text-center text-sm ${themeColors.text.tertiary}`}>Aucun utilisateur trouvé.</p>
      ) : (
        <div>
          {data.users.map((user) => (
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
              onError={setError}
              onRoleChanged={(role) => updateUserRole(user.id, role)}
              onDelete={() => deleteUser(user)}
            />
          ))}
        </div>
      )}

      <div className="flex items-center justify-between gap-4">
        <span className={`text-xs ${themeColors.text.tertiary}`}>
          {data.pagination.total} utilisateur{data.pagination.total > 1 ? 's' : ''}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={page <= 1 || loading}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            className={paginationButtonClass}
          >
            Précédent
          </button>
          <span className={`text-xs tabular-nums ${themeColors.text.secondary}`}>
            {data.pagination.page}/{data.pagination.totalPages}
          </span>
          <button
            type="button"
            disabled={page >= data.pagination.totalPages || loading}
            onClick={() => setPage((current) => current + 1)}
            className={paginationButtonClass}
          >
            Suivant
          </button>
        </div>
      </div>
    </div>
  );
}

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
  user: AdminUsersResponse['users'][number];
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
    <ListRow className="relative grid gap-3 pr-8 sm:grid-cols-[9rem_minmax(0,1fr)] sm:items-start">
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

const paginationButtonClass = `rounded-lg px-2.5 py-1.5 text-xs ${themeColors.button.ghost} ${themeColors.transitionAll} ${themeColors.util.activeScale} disabled:cursor-not-allowed disabled:opacity-40`;

function removeUserFromResponse(
  response: AdminUsersResponse,
  userId: string,
): AdminUsersResponse {
  const total = Math.max(0, response.pagination.total - 1);
  return {
    users: response.users.filter((user) => user.id !== userId),
    pagination: {
      ...response.pagination,
      total,
      totalPages: Math.max(1, Math.ceil(total / response.pagination.pageSize)),
    },
  };
}
