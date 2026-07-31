'use client';

import {
  useEffect,
  useState,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
} from 'react';
import { themeColors } from '@/lib/theme-colors';
import ActionButton from '@/components/ui/ActionButton';

interface TypedDestructiveActionProps {
  actionLabel: string;
  children?: (reset: () => void) => ReactNode;
  confirmationMessage: string;
  confirmationValue: string;
  disabled?: boolean;
  layout?: 'form' | 'compact';
  onConfirm: () => void;
}

export function useTypedConfirmation({
  confirmationValue,
  disabled,
  onConfirm,
}: {
  confirmationValue: string;
  disabled: boolean;
  onConfirm: () => void;
}) {
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [enteredValue, setEnteredValue] = useState('');
  const valid = confirmationValue.length > 0 && enteredValue === confirmationValue;

  const reset = () => {
    setConfirmationOpen(false);
    setEnteredValue('');
  };

  useEffect(() => {
    setConfirmationOpen(false);
    setEnteredValue('');
  }, [confirmationValue]);

  useEffect(() => {
    if (disabled) {
      setConfirmationOpen(false);
      setEnteredValue('');
    }
  }, [disabled]);

  const handleAction = () => {
    if (!confirmationOpen) {
      setConfirmationOpen(true);
      return;
    }
    if (!valid) return;
    onConfirm();
    reset();
  };

  return {
    confirmationOpen,
    enteredValue,
    handleAction,
    reset,
    setEnteredValue,
    valid,
  };
}

export function TypedConfirmationInput({
  className = '',
  ...inputProps
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type="text"
      autoCapitalize="none"
      autoComplete="off"
      autoCorrect="off"
      spellCheck={false}
      {...inputProps}
      className={`min-w-0 flex-grow px-3 py-2 text-sm ${themeColors.input.search} border ${themeColors.util.roundedLg} focus:outline-none focus:ring-2 ${themeColors.transition} ${className}`}
    />
  );
}

export function ConfirmationCancelButton({
  className = '',
  ...buttonProps
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <ActionButton
      variant="neutralOutline"
      {...buttonProps}
      className={className}
    />
  );
}

export function DestructiveActionButton({
  className = '',
  disabled,
  filled = false,
  ...buttonProps
}: ButtonHTMLAttributes<HTMLButtonElement> & { filled?: boolean }) {
  return (
    <ActionButton
      variant={filled ? 'dangerFilled' : 'dangerOutline'}
      disabled={disabled}
      {...buttonProps}
      className={className}
    />
  );
}

export default function TypedDestructiveAction({
  actionLabel,
  children,
  confirmationMessage,
  confirmationValue,
  disabled = false,
  layout = 'form',
  onConfirm,
}: TypedDestructiveActionProps) {
  const confirmation = useTypedConfirmation({
    confirmationValue,
    disabled,
    onConfirm,
  });

  const actionDisabled = disabled
    || (confirmation.confirmationOpen && !confirmation.valid);
  const compact = layout === 'compact';

  return (
    <div className={`flex max-w-full flex-col gap-3 ${
      compact ? `relative ${confirmation.confirmationOpen ? 'w-72' : ''}` : ''
    }`}>
      <div className={`flex gap-3 ${
        compact
          ? 'flex-col sm:flex-row sm:items-center'
          : 'flex-col md:flex-row md:items-center'
      }`}>
        {confirmation.confirmationOpen && (
          <TypedConfirmationInput
            aria-label={confirmationMessage}
            placeholder={confirmationValue}
            value={confirmation.enteredValue}
            onChange={(event) => confirmation.setEnteredValue(event.target.value)}
          />
        )}
        <div className={`flex shrink-0 justify-end gap-2 ${
          compact ? '' : 'md:ml-auto'
        }`}>
          <DestructiveActionButton
            onClick={confirmation.handleAction}
            disabled={actionDisabled}
            filled={confirmation.confirmationOpen && confirmation.valid}
          >
            {actionLabel}
          </DestructiveActionButton>
          {compact && confirmation.confirmationOpen && (
            <ConfirmationCancelButton
              onClick={confirmation.reset}
            >
              Annuler
            </ConfirmationCancelButton>
          )}
          {children?.(confirmation.reset)}
        </div>
      </div>
      {confirmation.confirmationOpen && !compact && (
        <p className={`text-left text-xs ${themeColors.text.tertiary}`}>
          {confirmationMessage}
        </p>
      )}
      {confirmation.confirmationOpen && compact && (
        <p className={`absolute left-0 top-full mt-2 whitespace-nowrap text-xs ${themeColors.text.tertiary}`}>
          {confirmationMessage}
        </p>
      )}
    </div>
  );
}
