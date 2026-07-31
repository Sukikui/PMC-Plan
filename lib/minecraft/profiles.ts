import type { Prisma } from '@prisma/client';

const MINECRAFT_NAME_PATTERN = /^[A-Za-z0-9_]{3,16}$/;
const MOJANG_PROFILE_URL = 'https://api.mojang.com/profiles/minecraft';
const MOJANG_PROFILE_BATCH_SIZE = 10;

interface MojangProfile {
  id: string;
  name: string;
}

export class MinecraftProfileError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

export async function resolveMinecraftProfile(name: string) {
  const [profile] = await resolveMinecraftProfiles([name]);
  return profile;
}

export async function resolveMinecraftProfiles(names: string[]) {
  const normalizedNames = Array.from(new Set(names.map((name) => name.trim())));
  const invalidName = normalizedNames.find((name) => !MINECRAFT_NAME_PATTERN.test(name));
  if (invalidName || normalizedNames.length === 0) {
    throw new MinecraftProfileError('Ce pseudo Minecraft est invalide.', 400);
  }
  const profiles: MojangProfile[] = [];
  for (let index = 0; index < normalizedNames.length; index += MOJANG_PROFILE_BATCH_SIZE) {
    profiles.push(...await fetchMinecraftProfiles(
      normalizedNames.slice(index, index + MOJANG_PROFILE_BATCH_SIZE),
    ));
  }
  if (profiles.length !== normalizedNames.length) {
    throw new MinecraftProfileError('Ce compte Minecraft est introuvable.', 404);
  }

  return profiles.map((profile) => ({
    uuid: formatMinecraftUuid(profile.id),
    name: profile.name,
  }));
}

async function fetchMinecraftProfiles(names: string[]) {
  const response = await fetch(MOJANG_PROFILE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(names),
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new MinecraftProfileError(
      'Impossible de vérifier ce compte Minecraft pour le moment.',
      502,
    );
  }

  const profiles = await response.json() as MojangProfile[];
  return profiles;
}

export async function upsertMinecraftProfile(
  tx: Prisma.TransactionClient,
  profile: { uuid: string; name: string },
) {
  return tx.minecraftProfile.upsert({
    where: { uuid: profile.uuid },
    create: profile,
    update: { name: profile.name },
  });
}

export function formatMinecraftUuid(value: string) {
  const compact = value.replaceAll('-', '').toLowerCase();
  if (!/^[0-9a-f]{32}$/.test(compact)) {
    throw new MinecraftProfileError('Cet UUID Minecraft est invalide.', 400);
  }
  return [
    compact.slice(0, 8),
    compact.slice(8, 12),
    compact.slice(12, 16),
    compact.slice(16, 20),
    compact.slice(20),
  ].join('-');
}
