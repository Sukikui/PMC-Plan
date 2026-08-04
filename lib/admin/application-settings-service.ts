import type { AdapterUser } from '@auth/core/adapters';
import { prisma } from '@/lib/prisma';
import {
  DEFAULT_APPLICATION_SETTINGS,
  type AdminApplicationSettings,
} from './application-settings';

const APPLICATION_SETTINGS_ID = 'global';

export async function getApplicationSettings(): Promise<AdminApplicationSettings> {
  const settings = await prisma.applicationSettings.findUnique({
    where: { id: APPLICATION_SETTINGS_ID },
    select: { automaticUserApproval: true },
  });
  return settings ?? DEFAULT_APPLICATION_SETTINGS;
}

export async function saveApplicationSettings(
  settings: AdminApplicationSettings,
): Promise<AdminApplicationSettings> {
  return prisma.applicationSettings.upsert({
    where: { id: APPLICATION_SETTINGS_ID },
    create: { id: APPLICATION_SETTINGS_ID, ...settings },
    update: settings,
    select: { automaticUserApproval: true },
  });
}

export async function applyApprovalPolicyToCreatedUser(
  user: AdapterUser,
): Promise<AdapterUser> {
  if (user.role !== 'pending') return user;

  const settings = await getApplicationSettings();
  if (!settings.automaticUserApproval) return user;

  const approvedUser = await prisma.user.update({
    where: { id: user.id },
    data: { role: 'user' },
    select: { role: true },
  });
  return { ...user, role: approvedUser.role };
}
