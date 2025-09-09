'use client';

import { useState, useEffect } from 'react';
import { themeColors } from '../lib/theme-colors';

const HELP_MESSAGES = {
  'Vous n\'êtes pas dans un monde': 'Rejoignez le serveur pour synchroniser',
  'API désactivée dans le mod': 'Activez PlayerCoordsAPI dans les paramètres du mod',
  'Mod non détecté': 'Assurez-vous que le mod est installé et activé',
  'Timeout de connexion': 'Vérifiez votre connexion réseau',
  'Erreur inconnue': 'Veuillez contacter le support'
} as const;

interface SyncNotificationProps {
  error: string | null;
  onClose: () => void;
  topOffset?: string; // Position from top (e.g., "350px")
}

export default function SyncNotification({ error, onClose, topOffset = "350px" }: SyncNotificationProps) {
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

  const shouldShowDownloadButton = error !== 'Vous n\'êtes pas dans un monde' && error !== 'API désactivée dans le mod';

  return (
    <div 
      className={`fixed right-4 w-80 ${themeColors.syncNotification.errorBg} border ${themeColors.syncNotification.errorBorder} ${themeColors.util.roundedLg} p-3 z-[9999] transition-opacity duration-300 ${
        isErrorFading ? 'opacity-0' : 'opacity-100'
      }`}
      style={{ 
        top: topOffset,
        boxShadow: 'none'
      }}
    >
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 ${themeColors.syncNotification.statusDot} ${themeColors.util.roundedFull} ${themeColors.util.animatePulse}`}></div>
        <p className={`text-xs ${themeColors.syncNotification.errorText} font-medium`}>{error}</p>
      </div>
      <p className={`text-xs ${themeColors.syncNotification.helpText} mt-1 mb-2`}>
        {HELP_MESSAGES[error as keyof typeof HELP_MESSAGES] || HELP_MESSAGES['Erreur inconnue']}
      </p>
      {shouldShowDownloadButton && (
        <button
          onClick={() => window.open('https://modrinth.com/mod/playercoordsapi', '_blank')}
          className={`w-full px-3 py-2 text-xs ${themeColors.syncNotification.downloadBg} ${themeColors.syncNotification.downloadHoverBg} border ${themeColors.syncNotification.downloadBorder} ${themeColors.syncNotification.downloadHoverBorder} ${themeColors.syncNotification.downloadText} ${themeColors.syncNotification.downloadHoverText} ${themeColors.util.roundedLg} font-medium ${themeColors.transitionAll} flex items-center justify-center gap-1.5 ${themeColors.shadow.button} hover:shadow-md ${themeColors.blurSm}`}
        >
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
          Télécharger PlayerCoordsAPI
        </button>
      )}
    </div>
  );
}