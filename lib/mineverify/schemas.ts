import { z } from 'zod';

const isoDateString = z.string().datetime();

export const MineVerifyCodeCreatedSchema = z.object({
  appId: z.string().min(1),
  requestId: z.string().min(1),
  code: z.string().min(1),
  expiresAt: isoDateString,
});

export const MineVerifyValidatedSchema = z.object({
  appId: z.string().min(1),
  requestId: z.string().min(1),
  code: z.string().min(1),
  minecraftUuid: z.string().min(1),
  minecraftName: z.string().min(1),
  validatedAt: isoDateString,
});

export const MineVerifyExpiredSchema = z.object({
  appId: z.string().min(1),
  requestId: z.string().min(1),
  code: z.string().min(1),
  expiresAt: isoDateString,
  expiredAt: isoDateString,
});

export type MineVerifyCodeCreatedInput = z.infer<typeof MineVerifyCodeCreatedSchema>;
export type MineVerifyValidatedInput = z.infer<typeof MineVerifyValidatedSchema>;
export type MineVerifyExpiredInput = z.infer<typeof MineVerifyExpiredSchema>;
