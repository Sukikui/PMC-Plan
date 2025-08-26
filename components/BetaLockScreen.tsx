'use client';

import { useState, useEffect } from 'react';

interface BetaLockScreenProps {
  onUnlock: () => void;
}

export default function BetaLockScreen({ onUnlock }: BetaLockScreenProps) {
  const [password, setPassword] = useState('');
  const [isShaking, setIsShaking] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('pmc-plan-theme');
    const theme = savedTheme && ['light', 'dark', 'system'].includes(savedTheme) ? savedTheme : 'system';
    
    const applyTheme = (selectedTheme: string) => {
      const root = document.documentElement;
      
      if (selectedTheme === 'dark') {
        root.classList.add('dark');
      } else if (selectedTheme === 'light') {
        root.classList.remove('dark');
      } else if (selectedTheme === 'system') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (prefersDark) {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
      }
    };

    applyTheme(theme);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Yes. The password is basically hardcoded, congrats on finding it :)
    if (password === 'beta') {
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
      
      <div className="fixed inset-0 bg-gradient-to-br from-blue-100 dark:from-gray-900 via-white dark:via-gray-950 to-indigo-100 dark:to-gray-900 flex items-center justify-center z-50 transition-colors duration-300">
        <div className="bg-white/90 dark:bg-gray-900/95 backdrop-blur-md shadow-2xl rounded-xl border border-gray-200/50 dark:border-gray-600/50 p-8 max-w-md w-full mx-4 transition-colors duration-300">
          
          {/* Logo/Title */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-100 dark:from-blue-800/30 to-indigo-100 dark:to-indigo-800/30 flex items-center justify-center transition-colors duration-300">
              <svg className="w-8 h-8 text-blue-500 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2 transition-colors duration-300">
              PMC Plan
            </h1>
          </div>

          {/* Password Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors duration-300">
                Mot de passe
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Saisissez le mot de passe..."
                className={`w-full px-4 py-3 text-gray-900 dark:text-gray-100 bg-white/90 dark:bg-gray-800/90 border border-gray-200/50 dark:border-gray-600/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder-gray-400 dark:placeholder-gray-500 ${
                  isShaking ? 'animate-pulse' : ''
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
              className={`w-full py-3 px-4 rounded-lg font-medium transition-all ${
                password.trim()
                  ? "bg-blue-500 text-white hover:bg-blue-600 active:scale-95"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
              }`}
            >
              Débloquer l&apos;accès
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-200/50 dark:border-gray-600/50 text-center transition-colors duration-300">
            <p className="text-xs text-gray-500 dark:text-gray-400 transition-colors duration-300">
              Phase de test - Accès temporaire
            </p>
          </div>
        </div>
      </div>
    </>
  );
}