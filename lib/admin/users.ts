import type { Role } from '@prisma/client';
import type { MapEntryManagement } from '@/lib/map-entry/types';

export const ADMIN_USERS_PAGE_SIZE = 20;
export const PRIMARY_MANAGEMENT_TRANSFER_REQUIRED =
  'PRIMARY_MANAGEMENT_TRANSFER_REQUIRED';

export type AdminUserRoleFilter = 'all' | 'pending' | 'administrators';

export interface AdminUserSummary {
  id: string;
  name: string | null;
  username: string | null;
  image: string | null;
  role: Role;
  minecraftUuid: string | null;
  minecraftName: string | null;
  minecraftLinkedAt: string | null;
  createdAt: string;
}

export interface AdminUsersResponse {
  users: AdminUserSummary[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface AdminUserDeletionResponse {
  managementUpdates: MapEntryManagement[];
  message: string;
  transferredEntryCount: number;
  transferredSpaceCount: number;
}

export interface AdminUserDeletionError {
  code?: typeof PRIMARY_MANAGEMENT_TRANSFER_REQUIRED;
  error: string;
  primaryManagedContent?: AdminManagedContentCounts;
}

export interface AdminManagedContentCounts {
  places: number;
  portals: number;
  services: number;
  spaces: number;
}

export interface AdminUserTransferRequest {
  managedContent: AdminManagedContentCounts;
  user: AdminUserSummary;
}
