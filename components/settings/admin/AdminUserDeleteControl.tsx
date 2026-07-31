'use client';

import type { AdminUserSummary } from '@/lib/admin/users';
import { themeColors } from '@/lib/theme-colors';
import CrossIcon from '@/components/icons/CrossIcon';
import IdentitySummary from '@/components/settings/IdentitySummary';
import MinecraftHeadImage from '@/components/ui/MinecraftHeadImage';
import {
  ConfirmationCancelButton,
  DestructiveActionButton,
  TypedConfirmationInput,
  useTypedConfirmation,
} from '@/components/ui/TypedDestructiveAction';

interface AdminUserDeleteControlProps {
  canDelete: boolean;
  deleteDisabled: boolean;
  deleting: boolean;
  onDelete: () => void;
  user: AdminUserSummary;
}

export default function AdminUserDeleteControl({
  canDelete,
  deleteDisabled,
  deleting,
  onDelete,
  user,
}: AdminUserDeleteControlProps) {
  const minecraftIdentifier = user.minecraftUuid ?? user.minecraftName;
  const userLabel = user.name ?? user.username ?? user.minecraftName ?? 'cet utilisateur';
  const confirmationValue = user.username ? `@${user.username}` : '';
  const confirmation = useTypedConfirmation({
    confirmationValue,
    disabled: deleteDisabled || !confirmationValue,
    onConfirm: onDelete,
  });

  if (confirmation.confirmationOpen) {
    return (
      <div className="-mr-8 flex h-9 min-w-0 items-center gap-2">
        <TypedConfirmationInput
          autoFocus
          aria-label="Écris le nom d’utilisateur Discord pour confirmer la suppression"
          className={confirmationControlClass}
          placeholder={confirmationValue}
          value={confirmation.enteredValue}
          onChange={(event) => confirmation.setEnteredValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Escape') confirmation.reset();
          }}
        />
        <DestructiveActionButton
          className={`shrink-0 !px-2.5 !text-xs ${confirmationControlClass}`}
          disabled={deleteDisabled || !confirmation.valid}
          filled={confirmation.valid}
          onClick={confirmation.handleAction}
        >
          Supprimer
        </DestructiveActionButton>
        <ConfirmationCancelButton
          className={`shrink-0 !px-2.5 !text-xs ${confirmationControlClass}`}
          onClick={confirmation.reset}
        >
          Annuler
        </ConfirmationCancelButton>
      </div>
    );
  }

  return (
    <>
      <IdentitySummary
        avatar={(
          <MinecraftHeadImage
            playerIdentifier={minecraftIdentifier}
            alt={minecraftIdentifier
              ? `Tête de ${user.minecraftName ?? 'ce joueur'}`
              : 'Tête de Steve'}
            className="h-9 w-9"
          />
        )}
        title={minecraftIdentifier
          ? user.minecraftName ?? 'Joueur Minecraft'
          : 'Non lié'}
        subtitle={user.minecraftUuid}
        unlinked={!minecraftIdentifier}
      />

      {canDelete && (
        <button
          type="button"
          aria-label={`Supprimer le compte de ${userLabel}`}
          title={deleteDisabled || !confirmationValue
            ? 'Ce compte ne peut pas être supprimé.'
            : 'Supprimer le compte'}
          disabled={deleteDisabled || !confirmationValue}
          onClick={confirmation.handleAction}
          className={`absolute right-0 top-1/2 -translate-y-1/2 p-1 ${themeColors.adminUser.deleteAction} ${themeColors.interactive.focusRing} ${themeColors.transitionAll} disabled:cursor-not-allowed disabled:opacity-30`}
        >
          <CrossIcon className={`h-[18px] w-[18px] ${deleting ? 'animate-pulse' : ''}`} />
        </button>
      )}
    </>
  );
}

const confirmationControlClass = 'h-8 !py-0';
