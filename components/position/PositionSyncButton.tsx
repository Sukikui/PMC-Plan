import ActionButton from '@/components/ui/ActionButton';
import { themeColors } from '@/lib/theme-colors';

interface PositionSyncButtonProps {
  isConnected: boolean;
  isLoading: boolean;
  isShaking: boolean;
  onDisconnect: () => void;
  onSync: () => void;
}

export default function PositionSyncButton({
  isConnected,
  isLoading,
  isShaking,
  onDisconnect,
  onSync,
}: PositionSyncButtonProps) {
  return (
    <ActionButton
      variant={isConnected ? 'dangerOutline' : 'primaryOutline'}
      onClick={isConnected ? onDisconnect : onSync}
      disabled={isLoading}
      className={`shrink-0 !px-2.5 !py-1.5 !text-xs ${isShaking ? themeColors.util.animatePulse : ''}`}
      style={{ animation: isShaking ? 'panel-shake 0.5s ease-in-out' : undefined }}
    >
      {isLoading ? (
        <span className="flex items-center gap-1">
          <span className="h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" />
          Sync...
        </span>
      ) : isConnected ? 'Désynchroniser' : 'Synchroniser'}
    </ActionButton>
  );
}
