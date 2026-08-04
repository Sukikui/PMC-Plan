import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import {
  getApplicationSettings,
  saveApplicationSettings,
} from '@/lib/admin/application-settings-service';
import { getEffectiveRequestRole } from '@/lib/admin/request-role';
import { isAdministrationRole } from '@/lib/admin/roles';

const settingsSchema = z.object({
  automaticUserApproval: z.boolean(),
});

export async function GET(request: NextRequest) {
  if (!await canManageSettings(request)) {
    return NextResponse.json({ error: 'Accès administrateur requis.' }, { status: 403 });
  }
  return NextResponse.json({ settings: await getApplicationSettings() });
}

export async function PATCH(request: NextRequest) {
  if (!await canManageSettings(request)) {
    return NextResponse.json({ error: 'Accès administrateur requis.' }, { status: 403 });
  }

  const payload = await parsePayload(request);
  if (!payload) {
    return NextResponse.json({ error: 'Paramètres invalides.' }, { status: 400 });
  }

  return NextResponse.json({
    settings: await saveApplicationSettings(payload),
  });
}

async function canManageSettings(request: NextRequest) {
  const session = await auth();
  return isAdministrationRole(
    getEffectiveRequestRole(request, session?.user?.role),
  );
}

async function parsePayload(request: NextRequest) {
  try {
    const parsed = settingsSchema.safeParse(await request.json());
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}
