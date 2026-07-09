import { themeColors } from '@/lib/theme-colors';

interface PositionPanelHeaderProps {
  isConnected: boolean;
  isLoading: boolean;
  isShaking: boolean;
  onDisconnect: () => void;
  onSync: () => void;
}

export default function PositionPanelHeader({
  isConnected,
  isLoading,
  isShaking,
  onDisconnect,
  onSync,
}: PositionPanelHeaderProps) {
  return (
    <div className={`p-4 border-b ${themeColors.border.primary} ${themeColors.panel.primary} ${themeColors.blurSm} ${themeColors.transition}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 ${themeColors.util.roundedFull} ${isConnected ? `${themeColors.status.connected} ${themeColors.util.animatePulse}` : themeColors.status.disconnected}`} />
          <h2 className={`text-xs font-semibold ${themeColors.text.secondary} ${themeColors.util.uppercase} ${themeColors.transition}`}>Position du Client</h2>
        </div>

        <button
          onClick={isConnected ? onDisconnect : onSync}
          disabled={isLoading}
          className={`px-3 py-1.5 text-xs ${themeColors.util.roundedLg} font-medium ${themeColors.transitionAll} ${
            isLoading
              ? `${themeColors.interactive.disabled} cursor-not-allowed`
              : isConnected
                ? `${themeColors.button.danger} ${themeColors.util.activeScale}`
                : `${themeColors.button.primary} ${themeColors.util.activeScale}`
          } ${isShaking ? themeColors.util.animatePulse : ''}`}
          style={{ animation: isShaking ? 'shake 0.5s ease-in-out' : undefined }}
        >
          {isLoading ? (
            <div className="flex items-center gap-1">
              <div className={`w-3 h-3 border ${themeColors.text.secondary} border-t-transparent ${themeColors.util.roundedFull} ${themeColors.util.animateSpin}`} />
              Sync...
            </div>
          ) : isConnected ? 'Désynchroniser' : 'Synchroniser'}
        </button>
      </div>
    </div>
  );
}

