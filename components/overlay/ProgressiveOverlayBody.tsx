import type { ReactNode } from 'react';
import { themeColors } from '@/lib/theme-colors';

export default function ProgressiveOverlayBody({
  children,
  error,
  loading,
  onRetry,
}: {
  children?: ReactNode;
  error?: string | null;
  loading: boolean;
  onRetry?: () => void;
}) {
  if (!loading && !error) return children;

  return (
    <div className={`flex min-h-0 flex-1 items-center justify-center px-6 ${themeColors.panel.primary}`}>
      {error ? (
        <div className="text-center">
          <p className={`text-sm ${themeColors.feedback.errorText}`}>{error}</p>
          {onRetry && (
            <button
              className={`mt-3 text-sm ${themeColors.interactive.hoverAccentText} ${themeColors.interactive.focusRing}`}
              onClick={onRetry}
              type="button"
            >
              Réessayer
            </button>
          )}
        </div>
      ) : (
        <div className="w-full max-w-xl animate-pulse space-y-4">
          <div className={`h-4 w-2/3 ${themeColors.panel.secondary} ${themeColors.util.roundedLg}`} />
          <div className={`h-4 w-full ${themeColors.panel.secondary} ${themeColors.util.roundedLg}`} />
          <div className={`h-4 w-5/6 ${themeColors.panel.secondary} ${themeColors.util.roundedLg}`} />
        </div>
      )}
    </div>
  );
}
