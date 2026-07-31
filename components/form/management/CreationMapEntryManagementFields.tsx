'use client';

import {
  useEffect,
  type Dispatch,
  type SetStateAction,
} from 'react';
import { useSession } from 'next-auth/react';
import type {
  MapEntryDraft,
} from '@/lib/map-entry/types';
import { uniqueMinecraftOwners } from '@/lib/map-entry/types';
import type { MineVerifyPublicStatus } from '@/lib/mineverify/types';
import DraftMapEntryManagementFields from './DraftMapEntryManagementFields';
import { toManagedIdentity } from './managed-users';

interface CreationMapEntryManagementFieldsProps {
  disabled?: boolean;
  draft: MapEntryDraft;
  onChange: Dispatch<SetStateAction<MapEntryDraft>>;
  ownerRemovalGroup?: string;
  ownerTitle?: string;
}

export default function CreationMapEntryManagementFields({
  disabled = false,
  draft,
  onChange,
  ownerRemovalGroup,
  ownerTitle,
}: CreationMapEntryManagementFieldsProps) {
  const { data: session } = useSession();

  useEffect(() => {
    if (!session?.user?.id) return;
    let cancelled = false;
    void fetch('/api/minecraft-link/status', { cache: 'no-store' })
      .then((response) => response.json() as Promise<MineVerifyPublicStatus>)
      .then((status) => {
        if (
          cancelled
          || status.status !== 'linked'
          || !status.minecraftUuid
          || !status.minecraftName
        ) return;
        const owner = {
          uuid: status.minecraftUuid,
          name: status.minecraftName,
        };
        onChange((current) => (
          current.excludedOwnerUuids.includes(owner.uuid)
            ? current
            : {
                ...current,
                owners: uniqueMinecraftOwners([...current.owners, owner]),
              }
        ));
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [onChange, session?.user?.id]);

  return (
    <DraftMapEntryManagementFields
      disabled={disabled}
      draft={draft}
      onChange={onChange}
      ownerRemovalGroup={ownerRemovalGroup}
      ownerTitle={ownerTitle}
      primaryManager={toManagedIdentity({
        ...session?.user,
        id: session?.user?.id ?? '',
      })}
    />
  );
}
