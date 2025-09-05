'use client';

import { useState } from 'react';
import { useTheme } from '../lib/use-theme';
import { themeColors } from '../lib/theme-colors';

interface BetaLockScreenProps {
  onUnlock: () => void;
}

export default function BetaLockScreen({ onUnlock }: BetaLockScreenProps) {
  const [password, setPassword] = useState('');
  const [isShaking, setIsShaking] = useState(false);

  // The useTheme hook handles theme loading and application
  useTheme();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Get password from environment variable, fallback to 'beta'
    const expectedPassword = process.env.NEXT_PUBLIC_BETA_PASSWORD || 'beta';
    
    if (password === expectedPassword) {
      onUnlock();
    } else {
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      setPassword('');
    }
  };

  return (
    <>
      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
          20%, 40%, 60%, 80% { transform: translateX(4px); }
        }
      `}</style>
      
      <div className={`fixed inset-0 ${themeColors.background.lockScreen} flex items-center justify-center z-50 ${themeColors.transition}`}>
        <div className="max-w-md w-full mx-4">
          
          {/* Logo/Title */}
          <div className="text-center mb-8">
            <div className={`w-16 h-16 mx-auto mb-4 ${themeColors.util.roundedFull} ${themeColors.ui.iconContainer} flex items-center justify-center ${themeColors.transition}`}>
              <svg className={`w-8 h-8 ${themeColors.betaLockScreen.lockIcon}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className={`text-2xl font-bold ${themeColors.text.primary} mb-2 ${themeColors.transition}`}>
              PMC Plan
            </h1>
          </div>

          {/* Password Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="password" className={`block text-sm font-medium ${themeColors.text.quaternary} mb-2 ${themeColors.transition}`}>
                Mot de passe
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Saisissez le mot de passe..."
                className={`w-full px-4 py-3 ${themeColors.text.primary} ${themeColors.betaLockScreen.inputBg} border ${themeColors.betaLockScreen.inputBorder} ${themeColors.util.roundedLg} focus:outline-none focus:ring-2 ${themeColors.betaLockScreen.inputFocus} ${themeColors.transitionAll} ${themeColors.placeholder} ${
                  isShaking ? themeColors.util.animatePulse : ''
                }`}
                style={{
                  animation: isShaking ? 'shake 0.5s ease-in-out' : undefined
                }}
                autoFocus
              />
            </div>
            
            <button
              type="submit"
              disabled={!password.trim()}
              className={`w-full py-3 px-4 ${themeColors.util.roundedLg} font-medium ${themeColors.transitionAll} ${
                password.trim()
                  ? `${themeColors.button.primary} ${themeColors.util.activeScale}`
                  : `${themeColors.interactive.disabled} cursor-not-allowed`
              }`}
            >
              Débloquer l&apos;accès
            </button>
          </form>

          {/* Footer */}
          <div className={`mt-8 pt-6 border-t ${themeColors.betaLockScreen.separatorBorder} text-center ${themeColors.transition}`}>
            <p className={`text-xs ${themeColors.text.tertiary} ${themeColors.transition}`}>
              Phase de test - Accès temporaire
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
