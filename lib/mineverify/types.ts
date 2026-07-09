export type MineVerifyRequestStatus =
  | 'pending'
  | 'code_created'
  | 'validated'
  | 'expired';

export type MinecraftLinkStatus =
  | 'not_started'
  | 'pending'
  | 'code_created'
  | 'linked'
  | 'expired';

export interface MineVerifyRequestRecord {
  requestId: string;
  userId: string;
  code: string | null;
  expiresAt: Date | null;
  minecraftUuid: string | null;
  minecraftName: string | null;
  validatedAt: Date | null;
  expiredAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface MineVerifyPublicStatus {
  status: MinecraftLinkStatus;
  requestId?: string;
  code?: string;
  command?: string;
  expiresAt?: string;
  minecraftUuid?: string;
  minecraftName?: string;
  minecraftLinkedAt?: string;
}
