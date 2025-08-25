import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'PMC Plan',
  description: 'Navigate the Minecraft server with intelligent pathfinding through the Nether',
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
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
          {children}
        </div>
      </body>
    </html>
  );
}