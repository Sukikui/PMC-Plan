'use client';

import Image from 'next/image';
import DownloadIcon from '@/components/icons/DownloadIcon';
import ThemeSelector, { type AppTheme } from '@/components/settings/ThemeSelector';
import { PillActionLink } from '@/components/ui/PillAction';
import SectionSeparator from '@/components/ui/SectionSeparator';
import { themeColors } from '@/lib/theme-colors';

interface AppearanceSettingsProps {
    theme: AppTheme;
    onThemeChange: (theme: AppTheme) => void;
}

export default function AppearanceSettings({
                                               theme,
                                               onThemeChange,
                                           }: AppearanceSettingsProps) {
    return (
        <div>
            <section>
                <h3 className={`mb-3 text-sm font-medium ${themeColors.text.primary}`}>
                    Thème
                </h3>
                <ThemeSelector value={theme} onChange={onThemeChange} showLabel={false} />
            </section>

            <SectionSeparator className="my-6" />

            <section>
                <h3 className={`text-sm font-medium ${themeColors.text.primary}`}>
                    PlayerCoordsAPI
                </h3>

                <p className={`mt-1 max-w-xl text-sm ${themeColors.text.tertiary}`}>
                    Télécharge le mod pour que PMC Plan puisse récupérer la position de ton client Minecraft et calculer
                    automatiquement un itinéraire.
                </p>

                <div className="mt-4 flex items-center gap-2">
                    <Image
                        src="/integrations/playercoords-api/icon.jpeg"
                        alt="Icône de PlayerCoordsAPI"
                        width={56}
                        height={56}
                        className="h-14 w-14 shrink-0 rounded-lg object-cover"
                    />

                    <PillActionLink
                        href="https://modrinth.com/mod/playercoordsapi"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <DownloadIcon className="h-4 w-4" />
                        Télécharger sur Modrinth
                    </PillActionLink>
                </div>

                <div className="mt-5">
                    <p className={`mb-2 text-sm ${themeColors.text.tertiary}`}>
                        Après l&apos;installation, suis cette configuration pour autoriser PMC Plan à récupérer ta
                        position.
                    </p>

                    <Image
                        src="/integrations/playercoords-api/configuration.png"
                        alt="Configuration de PlayerCoordsAPI dans Minecraft"
                        width={2040}
                        height={1498}
                        className="mx-auto h-auto w-full max-w-2xl rounded-lg"
                    />
                </div>
            </section>
        </div>
    );
}
