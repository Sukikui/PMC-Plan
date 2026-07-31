import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Analytics } from '@vercel/analytics/react';
import { Providers } from '@/components/Providers';
import { themeColors } from '@/lib/theme-colors';
import './globals.css';
import './minecraft-effects.css';
import './animations.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'PMC Plan',
  description: 'Application de navigation et annuaire du serveur Play-MC.fr !',
  keywords: 'minecraft, pathfinding, nether, portal, navigation, map',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className={`${inter.className} transition-colors duration-300`}>
        <Providers>
          <div className={`min-h-screen ${themeColors.background.app}`}>
            {children}
          </div>
        </Providers>
        <Analytics />
      </body>
    </html>
  );
}
