import type {
  AdminUserDeletionError,
  AdminUserDeletionResponse,
  AdminUserRoleFilter,
  AdminUsersResponse,
} from './users';
import type { AssignableRole } from './roles';
import type { Role } from '@prisma/client';
import type { AdminApplicationSettings } from './application-settings';

const ADMIN_USERS_CHANGED_EVENT = 'pmc-plan:admin-users-changed';

export class AdminUserApiError extends Error {
  constructor(
    message: string,
    readonly details: AdminUserDeletionError,
  ) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export async function deleteAdminUser(
  userId: string,
  transferToUserId?: string,
): Promise<AdminUserDeletionResponse> {
  const response = await fetch(`/api/admin/users/${userId}`, {
    method: 'DELETE',
    headers: transferToUserId
      ? { 'Content-Type': 'application/json' }
      : undefined,
    body: transferToUserId
      ? JSON.stringify({ transferToUserId })
      : undefined,
  });
  const body = await response.json() as (
    AdminUserDeletionResponse & AdminUserDeletionError
  );

  if (!response.ok) {
    throw new AdminUserApiError(
      body.error ?? 'Impossible de supprimer le compte.',
      body,
    );
  }
  notifyAdminUsersChanged();
  return body;
}

export async function fetchAdminUsers({
  page = 1,
  query = '',
  role = 'all',
  signal,
}: {
  page?: number;
  query?: string;
  role?: AdminUserRoleFilter;
  signal?: AbortSignal;
} = {}): Promise<AdminUsersResponse> {
  const params = new URLSearchParams({ page: String(page), query, role });
  const response = await fetch(`/api/admin/users?${params}`, {
    cache: 'no-store',
    signal,
  });
  if (!response.ok) throw new Error('Impossible de charger les utilisateurs.');
  return response.json() as Promise<AdminUsersResponse>;
}

export async function fetchAdminApplicationSettings(
  signal?: AbortSignal,
): Promise<AdminApplicationSettings> {
  const response = await fetch('/api/admin/settings', {
    cache: 'no-store',
    signal,
  });
  const body = await response.json() as {
    settings?: AdminApplicationSettings;
    error?: string;
  };
  if (!response.ok || !body.settings) {
    throw new Error(body.error ?? 'Impossible de charger les paramètres.');
  }
  return body.settings;
}

export async function updateAdminApplicationSettings(
  settings: AdminApplicationSettings,
): Promise<AdminApplicationSettings> {
  const response = await fetch('/api/admin/settings', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings),
  });
  const body = await response.json() as {
    settings?: AdminApplicationSettings;
    error?: string;
  };
  if (!response.ok || !body.settings) {
    throw new Error(body.error ?? 'Impossible de modifier les paramètres.');
  }
  return body.settings;
}

export async function updateAdminUserRole(
  userId: string,
  role: AssignableRole,
): Promise<Role> {
  const response = await fetch(`/api/admin/users/${userId}/role`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role }),
  });
  const body = await response.json() as {
    user?: { role: Role };
    error?: string;
  };
  if (!response.ok || !body.user) {
    throw new Error(body.error ?? 'Impossible de modifier le rôle.');
  }
  notifyAdminUsersChanged();
  return body.user.role;
}

export function subscribeToAdminUserChanges(listener: () => void) {
  window.addEventListener(ADMIN_USERS_CHANGED_EVENT, listener);
  return () => window.removeEventListener(ADMIN_USERS_CHANGED_EVENT, listener);
}

function notifyAdminUsersChanged() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(ADMIN_USERS_CHANGED_EVENT));
  }
}
