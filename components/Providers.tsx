'use client';

import { SessionProvider } from 'next-auth/react';
import { OverlayProvider } from '@/components/overlay/OverlayProvider';
import { AdminModeProvider } from '@/components/admin/AdminModeProvider';
import AdminModeIndicator from '@/components/admin/AdminModeIndicator';
import { SettingsOverlayProvider } from '@/components/settings/SettingsOverlayProvider';
import { OverlayStackProvider } from '@/components/ui/OverlayStackProvider';
import DataQueryProvider from '@/components/DataQueryProvider';
import { PreferencesProvider } from '@/components/preferences/PreferencesProvider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <DataQueryProvider>
      <SessionProvider>
        <PreferencesProvider>
          <AdminModeProvider>
            <OverlayStackProvider>
              <SettingsOverlayProvider>
                <OverlayProvider>{children}</OverlayProvider>
              </SettingsOverlayProvider>
            </OverlayStackProvider>
            <AdminModeIndicator />
          </AdminModeProvider>
        </PreferencesProvider>
      </SessionProvider>
    </DataQueryProvider>
  );
}
