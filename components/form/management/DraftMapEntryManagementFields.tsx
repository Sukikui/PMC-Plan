'use client';

import { useState, type Dispatch, type SetStateAction } from 'react';
import IdentitySummary from '@/components/settings/IdentitySummary';
import MinecraftHeadImage from '@/components/ui/MinecraftHeadImage';
import { ListRow } from '@/components/ui/ListRow';
import FormFieldLabel from '@/components/form/common/FormFieldLabel';
import { themeColors } from '@/lib/theme-colors';
import type {
  MapEntryDraft,
  MapEntryUser,
  MinecraftOwner,
} from '@/lib/map-entry/types';
import { uniqueMinecraftOwners } from '@/lib/map-entry/types';
import ManagedUsersField, { type ManagedIdentity } from './ManagedUsersField';
import {
  appendUniqueManagedUser,
  removeManagedUser,
} from './managed-users';
import { RemoveButton } from './ManagementUi';
import OwnerNameInput from './OwnerNameInput';

interface DraftMapEntryManagementFieldsProps {
  canManageTeam?: boolean;
  disabled?: boolean;
  draft: MapEntryDraft;
  onChange: Dispatch<SetStateAction<MapEntryDraft>>;
  onTransfer?: (userId: string, confirmation: string) => Promise<boolean>;
  ownerRemovalGroup?: string;
  ownerTitle?: string;
  primaryManager: ManagedIdentity;
}

export default function DraftMapEntryManagementFields({
  canManageTeam = true,
  disabled = false,
  draft,
  onChange,
  onTransfer,
  ownerRemovalGroup = 'propriétaires',
  ownerTitle = 'Propriétaires',
  primaryManager,
}: DraftMapEntryManagementFieldsProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const controlsDisabled = busy || disabled;

  const addManager = (user: MapEntryUser) => {
    if (draft.managers.some(({ id }) => id === user.id)) return false;
    onChange((current) => ({
      ...current,
      managers: appendUniqueManagedUser(current.managers, user),
      owners: user.minecraftProfile
        ? uniqueMinecraftOwners([...current.owners, user.minecraftProfile])
        : current.owners,
      excludedOwnerUuids: user.minecraftProfile
        ? current.excludedOwnerUuids.filter(
            (uuid) => uuid !== user.minecraftProfile?.uuid,
          )
        : current.excludedOwnerUuids,
    }));
    setError(null);
    return true;
  };

  const resolveOwner = async (name: string) => {
    if (controlsDisabled) return false;
    setBusy(true);
    try {
      const response = await fetch('/api/minecraft/profiles/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      const payload = await response.json() as MinecraftOwner & { error?: string };
      if (!response.ok) {
        throw new Error(payload.error || 'Compte Minecraft introuvable.');
      }
      onChange((current) => ({
        ...current,
        owners: uniqueMinecraftOwners([...current.owners, payload]),
        excludedOwnerUuids: current.excludedOwnerUuids.filter(
          (uuid) => uuid !== payload.uuid,
        ),
      }));
      setError(null);
      return true;
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Erreur inattendue.',
      );
      return false;
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <ManagedUsersField
        busy={controlsDisabled}
        canManageTeam={canManageTeam}
        managers={draft.managers}
        onAdd={addManager}
        onError={setError}
        onRemove={(userId) => onChange((current) => ({
          ...current,
          managers: removeManagedUser(current.managers, userId),
        }))}
        onTransfer={onTransfer}
        primaryManager={primaryManager}
      />

      <section className="space-y-2">
        <FormFieldLabel>{ownerTitle}</FormFieldLabel>
        {draft.owners.map((owner) => (
          <ListRow key={owner.uuid} className="flex items-center justify-between gap-3">
            <IdentitySummary
              avatar={(
                <MinecraftHeadImage
                  playerIdentifier={owner.uuid}
                  alt={`Tête de ${owner.name}`}
                  className="h-9 w-9"
                />
              )}
              title={owner.name}
              subtitle={owner.uuid}
            />
            <RemoveButton
              label={`Retirer ${owner.name} des ${ownerRemovalGroup}`}
              disabled={controlsDisabled}
              onClick={() => onChange((current) => ({
                ...current,
                owners: current.owners.filter(({ uuid }) => uuid !== owner.uuid),
                excludedOwnerUuids: Array.from(new Set([
                  ...current.excludedOwnerUuids,
                  owner.uuid,
                ])),
              }))}
            />
          </ListRow>
        ))}
        <OwnerNameInput busy={controlsDisabled} onAdd={resolveOwner} />
      </section>
      {error && (
        <p className={`text-xs ${themeColors.feedback.errorText}`}>{error}</p>
      )}
    </div>
  );
}
