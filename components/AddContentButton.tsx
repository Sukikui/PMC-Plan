
'use client';

import { useSession } from 'next-auth/react';
import { useAdminMode } from '@/components/admin/AdminModeProvider';
import { useSettingsOverlay } from '@/components/settings/SettingsOverlayProvider';
import { PillActionButton } from '@/components/ui/PillAction';
import { canContribute } from '@/lib/content-permissions';
import { useOverlay } from './overlay/OverlayProvider';


interface AddContentButtonProps {
  className?: string;
  children: React.ReactNode;
  fullWidth?: boolean;
}

export default function AddContentButton({
  className,
  children,
  fullWidth,
}: AddContentButtonProps) {
  const { data: session, status } = useSession();
  const { effectiveRole } = useAdminMode();
  const { openFormOverlay } = useOverlay();
  const { open: openSettings } = useSettingsOverlay();
  const awaitingApproval = status === 'authenticated'
    && !canContribute(effectiveRole);

  const handleClick = () => {
    if (status === 'authenticated' && session?.user && !awaitingApproval) {
      openFormOverlay({ mode: 'add' });
    } else if (status === 'unauthenticated') {
      openSettings('account');
    }
  };

  return (
    <PillActionButton
      fullWidth={fullWidth}
      onClick={handleClick}
      disabled={status === 'loading' || awaitingApproval}
      title={awaitingApproval ? 'Ton compte est en attente d’approbation.' : undefined}
      className={`${className ?? ''} disabled:cursor-not-allowed disabled:opacity-50`}
    >
      {children}
    </PillActionButton>
  );
}
