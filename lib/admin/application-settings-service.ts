import type { Role } from '@prisma/client';
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

export async function getInitialUserRole(): Promise<Role> {
  const settings = await getApplicationSettings();
  return settings.automaticUserApproval ? 'user' : 'pending';
}
