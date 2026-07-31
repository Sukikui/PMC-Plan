'use client';

import { SessionProvider } from 'next-auth/react';
import { OverlayProvider } from '@/components/overlay/OverlayProvider';
import { AdminModeProvider } from '@/components/admin/AdminModeProvider';
import AdminModeIndicator from '@/components/admin/AdminModeIndicator';
import { SettingsOverlayProvider } from '@/components/settings/SettingsOverlayProvider';
import { OverlayStackProvider } from '@/components/ui/OverlayStackProvider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AdminModeProvider>
        <OverlayStackProvider>
          <SettingsOverlayProvider>
            <OverlayProvider>{children}</OverlayProvider>
          </SettingsOverlayProvider>
        </OverlayStackProvider>
        <AdminModeIndicator />
      </AdminModeProvider>
    </SessionProvider>
  );
}
