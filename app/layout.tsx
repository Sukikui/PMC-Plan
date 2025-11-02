import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Analytics } from '@vercel/analytics/react';
import { Providers } from '@/components/Providers';
import './globals.css';

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
    <html lang="en">
      <body className={`${inter.className} transition-colors duration-300`}>
        <Providers>
          <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
            {children}
          </div>
        </Providers>
        <Analytics />
      </body>
    </html>
  );
}