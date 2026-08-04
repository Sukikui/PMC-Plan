import StatusNotification from '@/components/ui/StatusNotification';

const HELP_MESSAGES = {
  'Synchronisation indisponible sur Safari': 'Utilisez Chrome ou Firefox pour synchroniser votre position',
  'Vous n\'êtes pas dans un monde': 'Rejoignez le serveur pour synchroniser',
  'Timeout de connexion': 'Vérifiez votre connexion réseau',
  'Erreur inconnue': 'Veuillez contacter le support'
} as const;

interface SyncNotificationProps {
  error: string | null;
  onClose: () => void;
}

export default function SyncNotification({
  error,
  onClose,
}: SyncNotificationProps) {
  if (!error) return null;

  return (
    <StatusNotification
      title={error}
      description={HELP_MESSAGES[error as keyof typeof HELP_MESSAGES] || HELP_MESSAGES['Erreur inconnue']}
      dismissAfterMs={4500}
      onClose={onClose}
      tone="error"
    />
  );
}
