'use client';

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from 'react';
import { useFormHasChanges } from './form-change-detection';

interface UseFormSubmissionOptions {
  isReady?: boolean;
  isValid: boolean;
  mode: 'add' | 'edit';
  snapshot: unknown;
}

export function useFormSubmission({
  isReady = true,
  isValid,
  mode,
  snapshot,
}: UseFormSubmissionOptions) {
  const hasChanges = useFormHasChanges(snapshot, isReady);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submissionLock = useRef(false);
  const mounted = useRef(true);
  const canSubmit = isReady && isValid && (mode === 'add' || hasChanges);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const execute = async (action: () => Promise<void>) => {
    if (submissionLock.current) return false;
    submissionLock.current = true;
    setIsSubmitting(true);
    setError(null);

    try {
      await action();
      return true;
    } catch (submissionError) {
      if (mounted.current) {
        setError(getSubmissionErrorMessage(submissionError));
      }
      return false;
    } finally {
      submissionLock.current = false;
      if (mounted.current) setIsSubmitting(false);
    }
  };

  const submit = async (
    event: FormEvent,
    action: () => Promise<void>,
  ) => {
    event.preventDefault();
    if (!canSubmit) return false;
    return execute(action);
  };

  return {
    canSubmit,
    error,
    execute,
    isSubmitting,
    setError,
    submit,
  };
}

function getSubmissionErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : 'Une erreur inattendue est survenue.';
}
