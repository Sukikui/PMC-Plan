import TypedDestructiveAction, {
  ConfirmationCancelButton,
} from '@/components/ui/TypedDestructiveAction';
import ActionButton from '@/components/ui/ActionButton';
import { themeColors } from '@/lib/theme-colors';

interface FormActionsProps {
  canSubmit?: boolean;
  error?: string | null;
  onCancel: () => void;
  isSubmitting: boolean;
  mode: 'add' | 'edit';
  onDelete?: () => void;
  entityType: 'place' | 'portal' | 'service' | 'space';
  entitySlug: string;
}

export default function FormActions({
  canSubmit = true,
  error,
  onCancel,
  isSubmitting,
  mode,
  onDelete,
  entityType,
  entitySlug,
}: FormActionsProps) {
  const entityLabel = {
    place: { definite: 'le lieu', genitive: 'du lieu' },
    portal: { definite: 'le portail', genitive: 'du portail' },
    service: { definite: 'le service', genitive: 'du service' },
    space: { definite: 'l’espace', genitive: 'de l’espace' },
  }[entityType];
  const confirmationMessage = `Pour confirmer la suppression définitive, écris le slug ${entityLabel.genitive}.`;
  const submitText = mode === 'add'
    ? `Créer ${entityLabel.definite}`
    : `Modifier ${entityLabel.definite}`;
  const submittingText = mode === 'add' ? 'Création…' : 'Modification…';

  return (
    <div className="space-y-3">
      {error && (
        <p className={`text-sm ${themeColors.feedback.errorText}`}>
          {error}
        </p>
      )}
      {onDelete ? (
        <TypedDestructiveAction
          actionLabel="Supprimer"
          confirmationMessage={confirmationMessage}
          confirmationValue={entitySlug}
          disabled={isSubmitting}
          onConfirm={onDelete}
        >
          {(reset) => (
            <>
              <ConfirmationCancelButton
                onClick={() => {
                  reset();
                  onCancel();
                }}
              >
                Annuler
              </ConfirmationCancelButton>
              <SubmitButton
                canSubmit={canSubmit}
                isSubmitting={isSubmitting}
                submitText={submitText}
                submittingText={submittingText}
              />
            </>
          )}
        </TypedDestructiveAction>
      ) : (
        <div className="flex justify-end gap-2">
          <ConfirmationCancelButton
            onClick={onCancel}
          >
            Annuler
          </ConfirmationCancelButton>
          <SubmitButton
            canSubmit={canSubmit}
            isSubmitting={isSubmitting}
            submitText={submitText}
            submittingText={submittingText}
          />
        </div>
      )}
    </div>
  );
}

function SubmitButton({
  canSubmit,
  isSubmitting,
  submitText,
  submittingText,
}: {
  canSubmit: boolean;
  isSubmitting: boolean;
  submitText: string;
  submittingText: string;
}) {
  return (
    <ActionButton
      type="submit"
      variant="primaryOutline"
      disabled={isSubmitting || !canSubmit}
    >
      {isSubmitting ? submittingText : submitText}
    </ActionButton>
  );
}
