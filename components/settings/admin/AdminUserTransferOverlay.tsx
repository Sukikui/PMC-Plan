'use client';

import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import DiscordUserSearch from '@/components/form/management/DiscordUserSearch';
import {
  RemoveButton,
  RoleBadge,
  UserIdentity,
} from '@/components/form/management/ManagementUi';
import ArrowRightIcon from '@/components/icons/ArrowRightIcon';
import ActionButton from '@/components/ui/ActionButton';
import OverlayPanel from '@/components/ui/OverlayPanel';
import { ConfirmationCancelButton } from '@/components/ui/TypedDestructiveAction';
import UserAvatar from '@/components/ui/UserAvatar';
import { deleteAdminUser } from '@/lib/admin/client';
import type { AdminUserTransferRequest } from '@/lib/admin/users';
import type { MapEntryUser } from '@/lib/map-entry/types';
import { applyMapEntryManagementUpdate } from '@/lib/map-entry/client-updates';
import { invalidateManagementQueries } from '@/lib/query/content-invalidation';
import { themeColors } from '@/lib/theme-colors';

interface AdminUserTransferOverlayProps {
  closing: boolean;
  isOpen: boolean;
  onClose: () => void;
  onComplete: (userId: string) => void;
  request: AdminUserTransferRequest | null;
}

export default function AdminUserTransferOverlay({
  closing,
  isOpen,
  onClose,
  onComplete,
  request,
}: AdminUserTransferOverlayProps) {
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState<MapEntryUser | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setSelectedUser(null);
    setBusy(false);
    setError(null);
  }, [isOpen, request?.user.id]);

  if (!request) return null;

  const handleTransfer = async () => {
    if (!selectedUser || busy) return;
    setBusy(true);
    setError(null);
    try {
      const response = await deleteAdminUser(request.user.id, selectedUser.id);
      response.managementUpdates.forEach((management) => {
        applyMapEntryManagementUpdate(queryClient, management);
      });
      invalidateManagementQueries(queryClient);
      onComplete(request.user.id);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Impossible de terminer le transfert.',
      );
    } finally {
      setBusy(false);
    }
  };

  const userLabel = request.user.name
    ?? request.user.username
    ?? 'Ce compte';

  return (
    <OverlayPanel
      isOpen={isOpen}
      closing={closing}
      height="content"
      onClose={busy ? () => {} : onClose}
      size="medium"
      title="Gestion du transfert"
    >
      <div className="space-y-6">
        <p className={`text-sm leading-relaxed ${themeColors.text.secondary}`}>
          <span className={`font-semibold ${themeColors.text.primary}`}>
            {userLabel}
          </span>
          {' '}gère actuellement{' '}
          <ManagedContentSummary content={request.managedContent} />. Nommer un
          nouveau gestionnaire principal qui en reprendra la gestion avant sa
          suppression.
        </p>

        <section className="space-y-5">
          <TransferComparison
            currentUser={request.user}
            selectedUser={selectedUser}
            busy={busy}
            onClear={() => setSelectedUser(null)}
          />
          <DiscordUserSearch
            busy={busy}
            excludedIds={[
              request.user.id,
              ...(selectedUser ? [selectedUser.id] : []),
            ]}
            onError={setError}
            onSelect={(user) => {
              setSelectedUser(user);
              setError(null);
              return true;
            }}
            placeholder={
              selectedUser
                ? 'Choisir un autre compte Discord...'
                : 'Ajouter via Discord...'
            }
          />
        </section>

        {error && (
          <p className={`text-xs ${themeColors.feedback.errorText}`}>{error}</p>
        )}

        <div className="flex justify-end gap-2">
          <ConfirmationCancelButton disabled={busy} onClick={onClose}>
            Annuler
          </ConfirmationCancelButton>
          <ActionButton
            disabled={!selectedUser || busy}
            onClick={() => void handleTransfer()}
            variant="dangerFilled"
          >
            {busy ? 'Transfert…' : 'Transférer et supprimer'}
          </ActionButton>
        </div>
      </div>
    </OverlayPanel>
  );
}

function ManagedContentSummary({
  content: { places, portals, services, spaces },
}: {
  content: AdminUserTransferRequest['managedContent'];
}) {
  const parts = [
    places > 0 ? `${places} lieu${places > 1 ? 'x' : ''}` : null,
    portals > 0 ? `${portals} portail${portals > 1 ? 's' : ''}` : null,
    spaces > 0 ? `${spaces} espace${spaces > 1 ? 's' : ''}` : null,
    services > 0 ? `${services} service${services > 1 ? 's' : ''}` : null,
  ].filter((part): part is string => Boolean(part));

  return (
    <>
      {parts.map((part, index) => (
        <span key={part}>
          {index > 0 && (index === parts.length - 1 ? ' et ' : ', ')}
          <span className={`font-semibold ${themeColors.text.primary}`}>
            {part}
          </span>
        </span>
      ))}
    </>
  );
}

function TransferComparison({
  busy,
  currentUser,
  onClear,
  selectedUser,
}: {
  busy: boolean;
  currentUser: AdminUserTransferRequest['user'];
  onClear: () => void;
  selectedUser: MapEntryUser | null;
}) {
  return (
    <div className="grid min-w-0 grid-cols-1 items-center gap-4 py-2 md:grid-cols-[minmax(0,14.5rem)_auto_minmax(0,14.5rem)] md:justify-center md:gap-16">
      <TransferIdentity
        action={<PrimaryManagerBadge hidden={Boolean(selectedUser)} />}
        align="end"
        user={currentUser}
      />

      <div className={`flex justify-center ${
        selectedUser ? themeColors.text.accent : themeColors.text.tertiary
      }`}>
        <span className="rotate-90 md:rotate-0">
          <ArrowRightIcon
            aria-hidden="true"
            className={`h-6 w-6 ${selectedUser ? 'transfer-arrow-active' : ''}`}
          />
        </span>
      </div>

      {selectedUser ? (
        <div key={selectedUser.id} className="transfer-target-enter">
          <TransferIdentity
            action={(
              <div className="flex shrink-0 items-center gap-1">
                <PrimaryManagerBadge hidden={false} />
                <RemoveButton
                  disabled={busy}
                  label="Retirer ce gestionnaire"
                  onClick={onClear}
                />
              </div>
            )}
            user={selectedUser}
          />
        </div>
      ) : (
        <EmptyTransferIdentity />
      )}
    </div>
  );
}

function TransferIdentity({
  action,
  align = 'start',
  user,
}: {
  action?: React.ReactNode;
  align?: 'start' | 'end';
  user: Pick<MapEntryUser, 'image' | 'name' | 'username'>;
}) {
  return (
    <div className={`flex min-w-0 justify-start ${
      align === 'end' ? 'md:justify-end' : ''
    }`}>
      <div className="flex max-w-full min-w-0 items-center gap-2">
        <div className="min-w-0">
          <UserIdentity user={user} />
        </div>
        {action}
      </div>
    </div>
  );
}

function EmptyTransferIdentity() {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <UserAvatar className="h-9 w-9" alt="Compte à sélectionner" />
      <div className="min-w-0">
        <p className={`truncate text-sm font-medium ${themeColors.text.tertiary}`}>
          À sélectionner
        </p>
        <p className={`truncate text-xs ${themeColors.text.quaternary}`}>
          Compte Discord
        </p>
      </div>
    </div>
  );
}

function PrimaryManagerBadge({ hidden }: { hidden: boolean }) {
  return (
    <div
      aria-hidden={hidden}
      className={`shrink-0 transition-[opacity,transform] duration-200 ease-out ${
        hidden
          ? 'translate-x-1 opacity-0'
          : 'translate-x-0 opacity-100'
      }`}
    >
      <RoleBadge>Principal</RoleBadge>
    </div>
  );
}
