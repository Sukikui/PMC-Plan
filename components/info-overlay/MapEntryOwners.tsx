'use client';

import type { MinecraftOwner } from '@/lib/map-entry/types';
import MinecraftProfileList from './MinecraftProfileList';

interface MapEntryOwnersProps {
  owners: MinecraftOwner[];
}

export default function MapEntryOwners({ owners }: MapEntryOwnersProps) {
  return (
    <MinecraftProfileList
      pluralTitle="Propriétaires"
      profiles={owners}
      singularTitle="Propriétaire"
    />
  );
}
