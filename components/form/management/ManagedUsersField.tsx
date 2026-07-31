'use client';

import type { MapEntryUser } from '@/lib/map-entry/types';
import { CONTENT_MANAGEMENT_LIMITS } from '@/lib/content/constraints';
import FormFieldLabel from '@/components/form/common/FormFieldLabel';
import { ListRow } from '@/components/ui/ListRow';
import DiscordUserSearch from './DiscordUserSearch';
import ManagerTransferAction from './ManagerTransferAction';
import {
  getUserLabel,
  RemoveButton,
  RoleBadge,
  UserIdentity,
} from './ManagementUi';

export type ManagedIdentity = Pick<
  MapEntryUser,
  'id' | 'image' | 'name' | 'username'
>;

interface ManagedUsersFieldProps {
  busy: boolean;
  canManageTeam?: boolean;
  managers: ManagedIdentity[];
  onAdd: (user: MapEntryUser) => Promise<boolean> | boolean;
  onError?: (message: string | null) => void;
  onRemove: (userId: string) => void;
  onTransfer?: (
    userId: string,
    confirmation: string,
  ) => Promise<boolean>;
  primaryManager: ManagedIdentity;
  title?: string;
}

export default function ManagedUsersField({
  busy,
  canManageTeam = true,
  managers,
  onAdd,
  onError,
  onRemove,
  onTransfer,
  primaryManager,
  title = 'Gestionnaires',
}: ManagedUsersFieldProps) {
  return (
    <section className="space-y-2">
      <FormFieldLabel>{title}</FormFieldLabel>
      <div>
        <ManagerRow user={primaryManager} badge="Principal" />
        {managers.map((user) => (
          <ManagerRow
            key={user.id}
            user={user}
            actions={canManageTeam ? (
              <>
                {onTransfer && (
                  <ManagerTransferAction
                    busy={busy}
                    discordUsername={user.username}
                    onTransfer={(confirmation) => (
                      onTransfer(user.id, confirmation)
                    )}
                  />
                )}
                <RemoveButton
                  label={`Retirer ${getUserLabel(user)} des gestionnaires`}
                  disabled={busy}
                  onClick={() => onRemove(user.id)}
                />
              </>
            ) : undefined}
          />
        ))}
      </div>
      {canManageTeam && managers.length < CONTENT_MANAGEMENT_LIMITS.managers && (
        <DiscordUserSearch
          busy={busy}
          excludedIds={[
            primaryManager.id,
            ...managers.map(({ id }) => id),
          ]}
          onError={onError}
          onSelect={onAdd}
        />
      )}
    </section>
  );
}

function ManagerRow({
  user,
  badge,
  actions,
}: {
  user: ManagedIdentity;
  badge?: string;
  actions?: React.ReactNode;
}) {
  return (
    <ListRow className="flex items-center justify-between gap-3">
      <UserIdentity user={user} />
      <div className="flex min-w-0 items-center gap-2">
        {badge && <RoleBadge>{badge}</RoleBadge>}
        {actions}
      </div>
    </ListRow>
  );
}
