import React from 'react';
import { themeColors } from '@/lib/theme-colors';

interface FormActionsProps {
  onCancel: () => void;
  isSubmitting: boolean;
  submitText: string;
  submittingText: string;
  onDelete?: () => void;
  entityType: 'place' | 'portal';
  entitySlug: string;
}

export default function FormActions({ onCancel, isSubmitting, submitText, submittingText, onDelete, entityType, entitySlug }: FormActionsProps) {
  const [showSlugInput, setShowSlugInput] = React.useState(false);
  const [enteredSlug, setEnteredSlug] = React.useState('');

  const isSlugValid = enteredSlug === entitySlug;

  React.useEffect(() => {
    if (isSubmitting) {
      setShowSlugInput(false);
      setEnteredSlug('');
    }
  }, [isSubmitting]);

  const handleDeleteClick = () => {
    if (!onDelete) return;

    if (!showSlugInput) {
      setShowSlugInput(true);
    } else if (isSlugValid) {
      onDelete();
      setShowSlugInput(false);
      setEnteredSlug('');
    }
  };

  const confirmationMessage = `Pour confirmer la suppression, veuillez écrire le slug du ${entityType === 'place' ? 'lieu' : 'portail'}. Notez que les ${entityType === 'place' ? 'lieux' : 'portails'} supprimés sont conservés dans la base de données et peuvent être restaurés par un admin.`;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col md:flex-row md:items-center gap-3">
        {showSlugInput && (
          <input
            type="text"
            className={`flex-grow w-full px-3 py-2 text-sm ${themeColors.input.search} border ${themeColors.util.roundedLg} focus:outline-none focus:ring-2 ${themeColors.transition}`}
            placeholder={entitySlug}
            value={enteredSlug}
            onChange={(e) => setEnteredSlug(e.target.value)}
          />
        )}
        <div className="flex justify-end gap-2 flex-shrink-0 md:ml-auto">
          {onDelete && (
            <button
              type="button"
              onClick={handleDeleteClick}
              disabled={isSubmitting || (showSlugInput && !isSlugValid)}
              className={`px-4 py-2 text-sm ${themeColors.util.roundedLg} border ${themeColors.transitionAll} ${
                isSubmitting || (showSlugInput && !isSlugValid)
                  ? themeColors.button.redDisabled
                  : 'text-red-500 dark:text-red-400 bg-transparent hover:border-red-400 dark:hover:border-red-500 hover:bg-red-100/20 dark:hover:bg-red-500/10 border-red-500'
              }`}
            >
              Supprimer
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              setShowSlugInput(false);
              setEnteredSlug('');
              onCancel();
            }}
            className={`px-4 py-2 text-sm ${themeColors.util.roundedLg} border ${themeColors.border.primary} ${themeColors.transitionAll} text-gray-700 dark:text-gray-200 bg-transparent hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-100/20 dark:hover:bg-blue-500/10`}
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className={`px-4 py-2 text-sm ${isSubmitting ? themeColors.button.primaryDisabled : themeColors.button.primary} ${themeColors.util.roundedLg} ${themeColors.transitionAll}`}
          >
            {isSubmitting ? submittingText : submitText}
          </button>
        </div>
      </div>
      {showSlugInput && (
        <p className={`text-xs text-left ${themeColors.text.tertiary}`}>
          {confirmationMessage}
        </p>
      )}
    </div>
  );
}
