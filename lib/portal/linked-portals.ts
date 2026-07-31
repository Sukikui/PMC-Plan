interface PortalCoordinates {
  x: number;
  y: number;
  z: number;
}

interface PortalPairIdentity {
  mapEntryId: string;
  world: string;
}

interface PortalDisplayIdentity extends PortalPairIdentity {
  id: string;
  slug: string;
  name: string;
}

interface PortalPairRecord extends PortalPairIdentity {
  address: string | null;
  coordinates: PortalCoordinates;
  description: string | null;
}

export interface LinkedPortalPair<T extends PortalPairIdentity> {
  overworld: T;
  nether: T;
}

export function indexLinkedPortalPairs<T extends PortalPairIdentity>(
  portals: readonly T[],
): Map<string, LinkedPortalPair<T>> {
  const candidates = new Map<string, {
    overworld?: T;
    nether?: T;
  }>();

  portals.forEach((portal) => {
    if (portal.world !== 'overworld' && portal.world !== 'nether') return;
    const candidate = candidates.get(portal.mapEntryId) ?? {};
    candidate[portal.world] = portal;
    candidates.set(portal.mapEntryId, candidate);
  });

  const pairs = new Map<string, LinkedPortalPair<T>>();
  candidates.forEach((candidate, mapEntryId) => {
    if (!candidate.overworld || !candidate.nether) return;
    pairs.set(mapEntryId, {
      overworld: candidate.overworld,
      nether: candidate.nether,
    });
  });
  return pairs;
}

export function mergeLinkedPortalPair<T extends PortalPairRecord>(
  pair: LinkedPortalPair<T>,
) {
  return {
    ...pair.overworld,
    'nether-associate': {
      coordinates: pair.nether.coordinates,
      address: pair.nether.address ?? '',
      description: pair.nether.description,
    },
  };
}

export function normalizeLinkedPortalIdentities<T extends PortalDisplayIdentity>(
  portals: readonly T[],
): T[] {
  const pairs = indexLinkedPortalPairs(portals);
  return portals.map((portal) => {
    const pair = pairs.get(portal.mapEntryId);
    if (!pair || portal.world === 'overworld') return portal;

    return {
      ...portal,
      id: pair.overworld.id,
      slug: pair.overworld.slug,
      name: pair.overworld.name,
    };
  });
}
