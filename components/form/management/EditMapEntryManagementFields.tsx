'use client';

import type { Dispatch, SetStateAction } from 'react';
import type { MapEntryDraft } from '@/lib/map-entry/types';
import DraftMapEntryManagementFields from './DraftMapEntryManagementFields';
import {
  appendUniqueManagedUser,
  removeManagedUser,
} from './managed-users';

interface EditMapEntryManagementFieldsProps {
  canManageTeam: boolean;
  disabled?: boolean;
  draft: MapEntryDraft;
  onChange: Dispatch<SetStateAction<MapEntryDraft>>;
  ownerRemovalGroup?: string;
  ownerTitle?: string;
}

export default function EditMapEntryManagementFields({
  canManageTeam,
  disabled = false,
  draft,
  onChange,
  ownerRemovalGroup,
  ownerTitle,
}: EditMapEntryManagementFieldsProps) {
  const transfer = async (userId: string, confirmation: string) => {
    const nextPrimaryManager = draft.managers.find(({ id }) => id === userId);
    if (!nextPrimaryManager || !draft.primaryManager) return false;

    onChange((current) => ({
      ...current,
      managers: appendUniqueManagedUser(
        removeManagedUser(current.managers, userId),
        current.primaryManager!,
      ),
      primaryManager: nextPrimaryManager,
      transferConfirmation: confirmation,
    }));
    return true;
  };

  if (!draft.primaryManager) return null;

  return (
    <DraftMapEntryManagementFields
      canManageTeam={canManageTeam}
      disabled={disabled}
      draft={draft}
      onChange={onChange}
      onTransfer={transfer}
      ownerRemovalGroup={ownerRemovalGroup}
      ownerTitle={ownerTitle}
      primaryManager={draft.primaryManager}
    />
  );
}
