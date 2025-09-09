'use client';

import { useEffect } from 'react';
import { useTheme } from '../lib/use-theme';
import { themeColors } from '../lib/theme-colors';

interface StartupScreenProps {
  onUnlock: () => void;
}

export default function StartupScreen({ onUnlock }: StartupScreenProps) {
  // The useTheme hook handles theme loading and application
  useTheme();

  useEffect(() => {
    const timer = setTimeout(() => {
      onUnlock();
    }, 1000); // 1 second auto unlock

    return () => clearTimeout(timer);
  }, [onUnlock]);

  return (
    <div className={`fixed inset-0 ${themeColors.background.lockScreen} flex flex-col items-center justify-center z-50 ${themeColors.transition}`}>
      {/* Logo at top */}
      <div className="absolute top-10">
        <div className="w-64 h-64">
          <img
            src="/pmc_logo.png"
            alt="PMC Logo"
            className="w-full h-full object-contain"
            onError={(e) => {
              // Fallback to icon if logo fails to load
              e.currentTarget.style.display = 'none';
              const fallback = e.currentTarget.parentElement?.querySelector('.fallback-icon');
              if (fallback) {
                fallback.classList.remove('hidden');
              }
            }}
          />
          <div className={`w-64 h-64 mx-auto ${themeColors.util.roundedFull} ${themeColors.ui.iconContainer} flex items-center justify-center ${themeColors.transition} hidden fallback-icon`}>
            <svg className={`w-32 h-32 ${themeColors.betaLockScreen.lockIcon}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Title, loading text and spinner centered */}
      <div className="text-center mt-16">
        <h1 className={`text-4xl font-bold ${themeColors.text.primary} mb-1 ${themeColors.transition}`}>
          PMC Plan
        </h1>
        <p className={`text-lg ${themeColors.text.quaternary} mb-8 ${themeColors.transition}`}>
          Chargement de l&apos;application...
        </p>

        {/* Loading indicator */}
        <div className="flex justify-center">
          <div className={`w-12 h-12 border-2 ${themeColors.text.secondary} border-t-transparent ${themeColors.util.roundedFull} ${themeColors.util.animateSpin}`}></div>
        </div>
      </div>
    </div>
  );
}