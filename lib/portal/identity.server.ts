import type { Prisma } from '@/generated/prisma/client';
import { MapEntryError } from '@/lib/map-entry/service';

export type PortalIdentityInput =
  | { status: 'unidentified'; slug: string }
  | { status: 'identified'; slug: string; name: string };

interface StoredPortalIdentity {
  slug: string;
  name: string | null;
}

export async function createPortalIdentity(
  tx: Prisma.TransactionClient,
  input: PortalIdentityInput,
): Promise<StoredPortalIdentity> {
  if (input.status === 'identified') {
    return normalizeIdentifiedPortal(input);
  }

  const existing = await tx.portal.findFirst({
    where: { slug: input.slug },
    select: { uid: true },
  });
  if (existing) {
    throw new MapEntryError(
      'Cet identifiant de portail est déjà utilisé. Recharge le formulaire pour en générer un autre.',
      409,
    );
  }

  return { slug: input.slug, name: null };
}

export async function claimPortalIdentity(
  tx: Prisma.TransactionClient,
  mapEntryId: string,
  input: Extract<PortalIdentityInput, { status: 'identified' }>,
  expectedPortalCount: number,
) {
  const identity = normalizeIdentifiedPortal(input);
  const result = await tx.portal.updateMany({
    where: { mapEntryId, name: null },
    data: identity,
  });
  if (result.count !== expectedPortalCount) {
    throw new MapEntryError(
      'Ce portail a déjà été revendiqué ou n’est plus disponible.',
      409,
    );
  }
  return identity;
}

export function updatePortalIdentity(
  stored: StoredPortalIdentity,
  input: PortalIdentityInput,
): StoredPortalIdentity {
  if (input.status === 'identified') {
    return normalizeIdentifiedPortal(input);
  }
  if (!stored.name && stored.slug !== input.slug) {
    throw new MapEntryError(
      'L’identifiant technique d’un portail inconnu ne peut pas être modifié.',
      400,
    );
  }

  return { slug: stored.name ? input.slug : stored.slug, name: null };
}

function normalizeIdentifiedPortal(
  input: Extract<PortalIdentityInput, { status: 'identified' }>,
): StoredPortalIdentity {
  return {
    slug: input.slug.toLowerCase(),
    name: input.name.trim(),
  };
}
