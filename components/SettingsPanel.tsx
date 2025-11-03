'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import BigPlusIcon from './icons/BigPlusIcon';
import CrossIcon from './icons/CrossIcon';
import ThemeSelector from '@/components/settings/ThemeSelector';
import ProfileCard from '@/components/settings/ProfileCard';
import IconButtonRound from './ui/IconButtonRound';
import ExternalLinks from '@/components/settings/ExternalLinks';
import Panel from './ui/Panel';
import SectionSeparator from './ui/SectionSeparator';
import { useTheme } from '../lib/use-theme';
import { themeColors } from '../lib/theme-colors';
import BigTradeIcon from './icons/BigTradeIcon';

interface SettingsPanelProps {
    onExpandedChange?: (expanded: boolean) => void;
    onOpenMarket?: () => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ onExpandedChange, onOpenMarket }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const panelRef = useRef<HTMLDivElement | null>(null);
    const [panelHeight, setPanelHeight] = useState(0);
    const GAP = 16; // px
    const TRIGGER = 48; // px (w-12 h-12)
    const { theme, changeTheme: handleThemeChange } = useTheme();
    const { data: session, status } = useSession();

    useEffect(() => {
        onExpandedChange?.(isExpanded);
    }, [isExpanded, onExpandedChange]);

    useEffect(() => {
        if (!isExpanded) return;
        const measure = () => {
            if (panelRef.current) {
                setPanelHeight(panelRef.current.getBoundingClientRect().height);
            }
        };
        const t = setTimeout(measure, 0);
        window.addEventListener('resize', measure);
        return () => {
            clearTimeout(t);
            window.removeEventListener('resize', measure);
        };
    }, [isExpanded]);

    return (
        <div className={`fixed bottom-4 right-4 z-50 transition-all duration-500 ease-out ${
            isExpanded ? 'w-80' : ''
        }`}>
            <div className="absolute right-0 z-10" style={{ bottom: isExpanded ? (panelHeight + GAP) : (TRIGGER + GAP) }}>
                <IconButtonRound onClick={onOpenMarket} aria-label="Ouvrir le marché global">
                    <BigTradeIcon className={`w-6 h-6 ${themeColors.text.secondary}`} />
                </IconButtonRound>
            </div>
            {!isExpanded ? (
                <IconButtonRound onClick={() => { setIsExpanded(true); }} aria-label="Ouvrir les paramètres">
                    <BigPlusIcon className={`w-6 h-6 ${themeColors.text.secondary}`} />
                </IconButtonRound>
            ) : (
                <div ref={panelRef}>
                <Panel>
                    <div className={`p-4 border-b ${themeColors.border.primary} ${themeColors.panel.primary} ${themeColors.blurSm} ${themeColors.transition} rounded-t-xl`}>
                        <div className="flex items-center justify-between">
                            <h2 className={`text-xs font-semibold ${themeColors.text.secondary} ${themeColors.util.uppercase} ${themeColors.transition}`}>Paramètres</h2>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => { setIsExpanded(false); }}
                                    className={`p-1 ${themeColors.util.roundedFull} ${themeColors.button.secondary} border ${themeColors.border.light} ${themeColors.shadow.button} ${themeColors.transitionAll} ${themeColors.util.hoverScale} ${themeColors.util.activeScale} ${themeColors.interactive.hoverBorder}`}
                                    aria-label="Fermer"
                                >
                                    <CrossIcon className={`w-4 h-4 ${themeColors.text.secondary}`} />
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className={`p-4 ${themeColors.panel.primary} ${themeColors.blurSm} rounded-b-xl ${themeColors.transition}`}>
                                                        <ThemeSelector value={theme} onChange={(t) => handleThemeChange(t)} showLabel={false} />
                        
                                                <div className="-mx-4 my-3"><SectionSeparator /></div>
                        
                                                <div className="space-y-2 -mb-1">
                                                    {status === 'loading' ? (
                                                        <div className={`flex items-center gap-2 text-xs ${themeColors.text.tertiary} px-2 py-2`}>
                                                            <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                            </svg>
                                                            Chargement...
                                                        </div>
                                                    ) : session?.user ? (
                                                            <ProfileCard
                                                              user={{
                                                                image: session.user.image,
                                                                name: session.user.name,
                                                                role: session.user.role,
                                                                username: session.user.username ?? null,
                                                                globalName: session.user.globalName ?? null,
                                                              }}
                                                              onSignOut={() => signOut()}
                                                            />                            ) : (
                                <button
                                    onClick={() => signIn('discord')}
                                    className={`flex items-center gap-2 text-xs ${themeColors.link} px-2 py-2 ${themeColors.util.roundedFull} ${themeColors.transitionAll} w-full`}
                                >
                                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.211.375-.445.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.197.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                                    </svg>
                                    Se connecter avec Discord
                                </button>
                            )}
                            <ExternalLinks />
                        </div>
                    </div>
                </Panel>
                </div>
            )}
        </div>
    );
};

export default SettingsPanel;
