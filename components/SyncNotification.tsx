'use client';

import { useState, useEffect } from 'react';
import FloatingStatusBubble from '@/components/ui/FloatingStatusBubble';
import { themeColors } from '../lib/theme-colors';

const HELP_MESSAGES = {
  'Synchronisation indisponible sur Safari': 'Utilisez Chrome ou Firefox pour synchroniser votre position',
  'Vous n\'êtes pas dans un monde': 'Rejoignez le serveur pour synchroniser',
  'Timeout de connexion': 'Vérifiez votre connexion réseau',
  'Erreur inconnue': 'Veuillez contacter le support'
} as const;

interface SyncNotificationProps {
  error: string | null;
  onClose: () => void;
  topOffset: number;
}

export default function SyncNotification({
  error,
  onClose,
  topOffset,
}: SyncNotificationProps) {
  const [isErrorFading, setIsErrorFading] = useState(false);

  useEffect(() => {
    if (error) {
      setIsErrorFading(false);
      // Auto-fade after 4.5 seconds
      const fadeTimeout = setTimeout(() => {
        setIsErrorFading(true);
        // Close after fade animation (300ms)
        setTimeout(() => onClose(), 300);
      }, 4500);

      return () => clearTimeout(fadeTimeout);
    }
  }, [error, onClose]);

  if (!error) return null;

  return (
    <FloatingStatusBubble
      highlightOnHover={false}
      shape="rounded"
      className={`fixed right-4 z-[9999] w-[calc(100vw-2rem)] max-w-80 p-3 transition-opacity duration-300 ${
        isErrorFading ? 'opacity-0' : 'opacity-100'
      }`}
      style={{ top: topOffset }}
    >
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 ${themeColors.syncNotification.statusDot} ${themeColors.util.roundedFull} ${themeColors.util.animatePulse}`}></div>
        <p className={`text-xs ${themeColors.syncNotification.errorText} font-medium`}>{error}</p>
      </div>
      <p className={`mt-1 text-xs ${themeColors.syncNotification.helpText}`}>
        {HELP_MESSAGES[error as keyof typeof HELP_MESSAGES] || HELP_MESSAGES['Erreur inconnue']}
      </p>
    </FloatingStatusBubble>
  );
}
