import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Analytics } from '@vercel/analytics/react';
import { Providers } from '@/components/Providers';
import { themeColors } from '@/lib/theme-colors';
import './globals.css';
import './minecraft-effects.css';
import './animations.css';

const inter = Inter({ subsets: ['latin'] });
const appName = 'PMC Plan';
const appDescription = 'Tous les lieux, portails et commerces du serveur Play-MC.fr réunis ' +
  'au sein d\'une même application de navigation !';
const appMark = {
  url: '/branding/pmc/mark.png',
  width: 110,
  height: 110,
  alt: 'Logo PMC Plan',
};

export const metadata: Metadata = {
  metadataBase: new URL('https://pmc-plan.vercel.app'),
  title: appName,
  description: appDescription,
  applicationName: appName,
  keywords: 'minecraft, pathfinding, nether, portal, navigation, map',
  alternates: {
    canonical: '/',
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: appMark.url, type: 'image/png' },
    ],
    apple: appMark.url,
  },
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: '/',
    siteName: appName,
    title: appName,
    description: appDescription,
    images: [appMark],
  },
  twitter: {
    card: 'summary',
    title: appName,
    description: appDescription,
    images: [appMark.url],
  },
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
