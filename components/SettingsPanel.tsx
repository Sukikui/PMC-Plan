'use client';

import React, { useState, useEffect } from 'react';
import BigPlusIcon from './icons/BigPlusIcon';
import PlusIcon from './icons/PlusIcon';
import CrossIcon from './icons/CrossIcon';

const SettingsPanel = () => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [theme, setTheme] = useState('system');

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

    useEffect(() => {
        const savedTheme = localStorage.getItem('pmc-plan-theme');
        if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
            setTheme(savedTheme);
            applyTheme(savedTheme);
        } else {
            setTheme('system');
            applyTheme('system');
            localStorage.setItem('pmc-plan-theme', 'system');
        }
    }, []);

    const handleThemeChange = (newTheme: string) => {
        setTheme(newTheme);
        applyTheme(newTheme);
        localStorage.setItem('pmc-plan-theme', newTheme);
    };

    return (
        <div className={`fixed bottom-4 right-4 z-50 transition-all duration-500 ease-out ${
            isExpanded ? 'w-80' : ''
        }`}>
            {!isExpanded ? (
                <button 
                    onClick={() => setIsExpanded(true)}
                    className="w-12 h-12 rounded-full bg-white dark:bg-gray-900 hover:bg-white/90 hover:border-gray-300 dark:hover:border-gray-700 border border-gray-200/70 dark:border-gray-800/80 transition-all duration-300 flex items-center justify-center hover:scale-110 active:scale-95"
                    style={{
                        boxShadow: document.documentElement.classList.contains('dark') 
                            ? '0 8px 25px rgba(0, 0, 0, 0.4)'
                            : '0 8px 25px rgba(0, 0, 0, 0.15)'
                    }}
                    aria-label="Ouvrir les paramètres"
                >
                    <BigPlusIcon className="w-6 h-6 text-gray-400 dark:text-gray-400" />
                </button>
            ) : (
                <div className="bg-white/90 dark:bg-gray-900/95 backdrop-blur-md shadow-2xl dark:shadow-black/65 rounded-xl border border-gray-200/50 dark:border-gray-800/50 transition-colors duration-300">
                    {/* Header */}
                    <div className="p-4 border-b border-gray-200/50 dark:border-gray-800/50 bg-white/90 dark:bg-gray-900/95 backdrop-blur-sm transition-colors duration-300 rounded-t-xl">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide transition-colors duration-300">Paramètres</h2>
                            
                            <button
                                onClick={() => setIsExpanded(false)}
                                className="p-1 rounded-full bg-white hover:bg-white/90 hover:border-gray-300 border border-gray-200/70 shadow-sm transition-all duration-200 dark:bg-gray-900 dark:border-gray-800/80 dark:hover:border-gray-700 dark:shadow-black/65"
                                aria-label="Fermer"
                            >
                                <CrossIcon className="w-4 h-4 text-gray-400 dark:text-gray-400" />
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-4 bg-white/90 dark:bg-gray-900/95 backdrop-blur-sm rounded-b-xl transition-colors duration-300">
                        {/* Theme selector */}
                        <div className="flex items-center gap-3 mb-4">
                            <label className="text-xs font-medium text-gray-700 dark:text-gray-300 transition-colors duration-300">Thème</label>
                            <div className="flex gap-1">
                                <button
                                    onClick={() => handleThemeChange('light')}
                                    className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                                        theme === 'light'
                                            ? 'bg-yellow-100 dark:bg-yellow-800/30 text-yellow-700 dark:text-yellow-300 border-yellow-100 dark:border-none'
                                            : 'bg-white dark:bg-transparent text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                                    }`}
                                >
                                    Clair
                                </button>
                                <button
                                    onClick={() => handleThemeChange('dark')}
                                    className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                                        theme === 'dark'
                                            ? 'bg-gray-100 dark:bg-indigo-800/50 text-gray-700 dark:text-indigo-100 border-gray-100 dark:border-none'
                                            : 'bg-white dark:bg-transparent text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                                    }`}
                                >
                                    Sombre
                                </button>
                                <button
                                    onClick={() => handleThemeChange('system')}
                                    className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                                        theme === 'system'
                                            ? 'bg-blue-100 dark:bg-blue-800/50 text-blue-700 dark:text-blue-200 border-blue-100 dark:border-none'
                                            : 'bg-white dark:bg-transparent text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                                    }`}
                                >
                                    Système
                                </button>
                            </div>
                        </div>

                        {/* Separator */}
                        <div className="-mx-4 mb-3">
                            <div className="border-t border-gray-200/50 dark:border-gray-800/50"></div>
                        </div>

                        {/* Links */}
                        <div className="space-y-2">
                            <a 
                                href="https://modrinth.com/mod/playercoordsapi"
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="flex items-center gap-2 text-xs text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 hover:bg-gray-100 dark:hover:bg-gray-800 px-2 py-2 rounded-full transition-all duration-300"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                                </svg>
                                Télécharger PlayerCoordsAPI
                            </a>
                            
                            <a 
                                href="https://github.com/Sukikui/PMC-Plan/issues/new/choose"
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="flex items-center gap-2 text-xs text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 hover:bg-gray-100 dark:hover:bg-gray-800 px-2 py-2 rounded-full transition-all duration-300"
                            >
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12m-6-6h12" />
                                </svg>
                                Ajouter un lieu ou un portail
                            </a>
                            
                            <a 
                                href="https://github.com/Sukikui/PMC-Plan"
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="flex items-center gap-2 text-xs text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 hover:bg-gray-100 dark:hover:bg-gray-800 px-2 py-2 rounded-full transition-all duration-300"
                            >
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                                </svg>
                                Code source
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SettingsPanel;