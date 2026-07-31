'use client';

import { useSession } from 'next-auth/react';
import {
  useEffect,
  useRef,
  type Dispatch,
  type SetStateAction,
} from 'react';
import { useAdminMode } from '@/components/admin/AdminModeProvider';
import { canAdministerContent } from '@/lib/content-permissions';
import {
  toMapEntryDraft,
  type MapEntryDraft,
} from '@/lib/map-entry/types';
import { themeColors } from '@/lib/theme-colors';
import CreationMapEntryManagementFields from './CreationMapEntryManagementFields';
import EditMapEntryManagementFields from './EditMapEntryManagementFields';
import { useMapEntryManagement } from './useMapEntryManagement';

interface MapEntryManagementFieldsProps {
  disabled?: boolean;
  mapEntryId?: string;
  mode: 'add' | 'edit';
  draft: MapEntryDraft;
  onDraftChange: Dispatch<SetStateAction<MapEntryDraft>>;
  onReadyChange?: (ready: boolean) => void;
  ownerRemovalGroup?: string;
  ownerTitle?: string;
}

export default function MapEntryManagementFields({
  disabled = false,
  mapEntryId,
  mode,
  draft,
  onDraftChange,
  onReadyChange,
  ownerRemovalGroup,
  ownerTitle,
}: MapEntryManagementFieldsProps) {
  const { data: session } = useSession();
  const { effectiveRole } = useAdminMode();
  const state = useMapEntryManagement(mode === 'edit' ? mapEntryId : undefined);
  const initializedMapEntryId = useRef<string | null>(null);

  useEffect(() => {
    if (mode !== 'edit') return;
    initializedMapEntryId.current = null;
    onReadyChange?.(false);
  }, [mapEntryId, mode, onReadyChange]);

  useEffect(() => {
    if (mode === 'add') {
      onReadyChange?.(true);
      return;
    }
    if (
      !state.management
      || state.management.access.mapEntryId !== mapEntryId
      || initializedMapEntryId.current === mapEntryId
    ) return;

    initializedMapEntryId.current = mapEntryId ?? null;
    onDraftChange(toMapEntryDraft(state.management));
    onReadyChange?.(true);
  }, [
    mapEntryId,
    mode,
    onDraftChange,
    onReadyChange,
    state.management,
  ]);

  if (mode === 'add') {
    return (
      <CreationMapEntryManagementFields
        disabled={disabled}
        draft={draft}
        onChange={onDraftChange}
        ownerRemovalGroup={ownerRemovalGroup}
        ownerTitle={ownerTitle}
      />
    );
  }
  if (state.loading) {
    return (
      <p className={`py-4 text-sm ${themeColors.text.tertiary}`}>
        Chargement de la gestion...
      </p>
    );
  }
  if (!state.management) {
    return (
      <p className={`py-4 text-sm ${themeColors.feedback.errorText}`}>
        {state.error}
      </p>
    );
  }

  const canManageTeam = canAdministerContent(
    effectiveRole,
    session?.user?.id,
    state.management.access.primaryManagerId,
  );

  return (
    <EditMapEntryManagementFields
      canManageTeam={canManageTeam}
      disabled={disabled}
      draft={draft}
      onChange={onDraftChange}
      ownerRemovalGroup={ownerRemovalGroup}
      ownerTitle={ownerTitle}
    />
  );
}
