'use client';

import ActionButton from '@/components/ui/ActionButton';
import {
  ConfirmationCancelButton,
  TypedConfirmationInput,
  useTypedConfirmation,
} from '@/components/ui/TypedDestructiveAction';

interface ManagerTransferActionProps {
  busy: boolean;
  discordUsername: string | null;
  onTransfer: (confirmation: string) => Promise<boolean>;
}

export default function ManagerTransferAction({
  busy,
  discordUsername,
  onTransfer,
}: ManagerTransferActionProps) {
  const confirmationValue = discordUsername ? `@${discordUsername}` : '';
  const confirmation = useTypedConfirmation({
    confirmationValue,
    disabled: busy || !confirmationValue,
    onConfirm: () => {
      void onTransfer(confirmation.enteredValue);
    },
  });

  if (!confirmation.confirmationOpen) {
    return (
      <ActionButton
        className="!px-2.5 !py-1 !text-xs"
        disabled={busy || !confirmationValue}
        variant="neutralOutline"
        onClick={confirmation.handleAction}
      >
        Transférer
      </ActionButton>
    );
  }

  return (
    <div className="flex min-w-0 items-center gap-2">
      <TypedConfirmationInput
        autoFocus
        aria-label="Écris l’identifiant Discord pour confirmer le transfert"
        autoComplete="off"
        className="browser-autofill-control-hidden h-8 !py-0"
        placeholder={confirmationValue}
        type="search"
        value={confirmation.enteredValue}
        onChange={(event) => confirmation.setEnteredValue(event.target.value)}
      />
      <ActionButton
        className={`h-8 shrink-0 !px-2.5 !py-0 !text-xs ${
          confirmation.valid ? '!border !border-transparent' : ''
        }`}
        disabled={!confirmation.valid || busy}
        variant={confirmation.valid ? 'primary' : 'primaryOutline'}
        onClick={confirmation.handleAction}
      >
        Confirmer
      </ActionButton>
      <ConfirmationCancelButton
        className="h-8 shrink-0 !px-2.5 !py-0 !text-xs"
        onClick={confirmation.reset}
      >
        Annuler
      </ConfirmationCancelButton>
    </div>
  );
}
