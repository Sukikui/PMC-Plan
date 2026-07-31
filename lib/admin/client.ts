import type {
  AdminUserDeletionError,
  AdminUserDeletionResponse,
} from './users';

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
  return body;
}
